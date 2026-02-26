use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("HJkUBA1W9Dcd83WC7CiCXpdZRc3iHQy7Pwp355jGWmNj");

#[program]
pub mod oracle_token {
    use super::*;

    /// Initialize the Oracle Token program
    pub fn initialize(
        ctx: Context<Initialize>,
        platform_fee_bps: u16, // basis points (e.g., 200 = 2%)
    ) -> Result<()> {
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.authority = ctx.accounts.authority.key();
        platform_state.oracle_token_mint = ctx.accounts.oracle_token_mint.key();
        platform_state.platform_fee_bps = platform_fee_bps;
        platform_state.total_markets = 0;
        platform_state.bump = ctx.bumps.platform_state;
        
        msg!("Oracle Token Platform initialized!");
        Ok(())
    }

    /// Create a new prediction market
    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: u64,
        title: String,
        description: String,
        category: MarketCategory,
        resolution_timestamp: i64,
        options: Vec<String>,
    ) -> Result<()> {
        require!(options.len() >= 2 && options.len() <= 10, ErrorCode::InvalidOptionsCount);
        require!(resolution_timestamp > Clock::get()?.unix_timestamp, ErrorCode::InvalidResolutionTime);
        require!(title.len() <= 200, ErrorCode::TitleTooLong);
        
        let market = &mut ctx.accounts.market;
        let creator_profile = &mut ctx.accounts.creator_profile;
        
        // Check if creator has enough tokens to create market (anti-spam)
        // require!(creator_profile.total_tokens >= 1000, ErrorCode::InsufficientTokensToCreateMarket);
        
        market.market_id = market_id;
        market.creator = ctx.accounts.creator.key();
        market.title = title;
        market.description = description;
        market.category = category;
        market.options = options.clone();
        market.resolution_timestamp = resolution_timestamp;
        market.status = MarketStatus::Active;
        market.total_volume = 0;
        market.correct_option_index = None;
        market.created_at = Clock::get()?.unix_timestamp;
        market.bump = ctx.bumps.market;
        
        // Initialize vote counts
        market.option_votes = vec![0; options.len()];
        
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.total_markets += 1;
        
        creator_profile.markets_created += 1;
        
        msg!("Market {} created: {}", market_id, market.title);
        Ok(())
    }

    /// Make a prediction on a market
    pub fn make_prediction(
        ctx: Context<MakePrediction>,
        option_index: u8,
        amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let prediction = &mut ctx.accounts.prediction;
        let user_profile = &mut ctx.accounts.user_profile;
        
        require!(market.status == MarketStatus::Active, ErrorCode::MarketNotActive);
        require!(
            Clock::get()?.unix_timestamp < market.resolution_timestamp,
            ErrorCode::MarketExpired
        );
        require!(
            (option_index as usize) < market.options.len(),
            ErrorCode::InvalidOption
        );
        
        // Transfer tokens from user to market vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.market_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        // Record prediction
        prediction.user = ctx.accounts.user.key();
        prediction.market = market.key();
        prediction.option_index = option_index;
        prediction.amount = amount;
        prediction.timestamp = Clock::get()?.unix_timestamp;
        prediction.claimed = false;
        prediction.bump = ctx.bumps.prediction;
        
        // Update market stats
        market.total_volume += amount;
        market.option_votes[option_index as usize] += amount;
        
        // Update user profile
        user_profile.total_predictions += 1;
        user_profile.total_volume += amount;
        
        msg!("Prediction made on market {} for option {}", market.market_id, option_index);
        Ok(())
    }

    /// Resolve a market (can only be done by validators with enough tokens)
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        correct_option_index: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let resolver_profile = &ctx.accounts.resolver_profile;
        
        require!(market.status == MarketStatus::Active, ErrorCode::MarketNotActive);
        require!(
            Clock::get()?.unix_timestamp >= market.resolution_timestamp,
            ErrorCode::MarketNotExpired
        );
        require!(
            (correct_option_index as usize) < market.options.len(),
            ErrorCode::InvalidOption
        );
        
        // Check if resolver has oracle status (10,000+ tokens)
        require!(
            resolver_profile.total_tokens >= 10000,
            ErrorCode::InsufficientResolverCredentials
        );
        
        market.status = MarketStatus::PendingResolution;
        market.correct_option_index = Some(correct_option_index);
        market.resolver = Some(ctx.accounts.resolver.key());
        market.resolved_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("Market {} resolved to option {}", market.market_id, correct_option_index);
        Ok(())
    }

    /// Claim rewards after market resolution
    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        let market = &ctx.accounts.market;
        let prediction = &mut ctx.accounts.prediction;
        let user_profile = &mut ctx.accounts.user_profile;
        
        require!(market.status == MarketStatus::Resolved, ErrorCode::MarketNotResolved);
        require!(!prediction.claimed, ErrorCode::AlreadyClaimed);
        require!(prediction.user == ctx.accounts.user.key(), ErrorCode::Unauthorized);
        
        let correct_option = market.correct_option_index.unwrap();
        
        if prediction.option_index == correct_option {
            // Calculate rewards
            let total_correct_volume = market.option_votes[correct_option as usize];
            let user_share = (prediction.amount as u128)
                .checked_mul(market.total_volume as u128)
                .unwrap()
                .checked_div(total_correct_volume as u128)
                .unwrap() as u64;
            
            // Calculate platform fee
            let platform_state = &ctx.accounts.platform_state;
            let fee = user_share
                .checked_mul(platform_state.platform_fee_bps as u64)
                .unwrap()
                .checked_div(10000)
                .unwrap();
            let payout = user_share.checked_sub(fee).unwrap();
            
            // Calculate Oracle Tokens earned based on accuracy metrics
            let early_bird_bonus = calculate_early_bird_bonus(
                prediction.timestamp,
                market.created_at,
                market.resolution_timestamp,
            );
            let difficulty_score = calculate_difficulty_score(
                total_correct_volume,
                market.total_volume,
            );
            
            let oracle_tokens_earned = (prediction.amount as u128)
                .checked_mul(early_bird_bonus as u128)
                .unwrap()
                .checked_mul(difficulty_score as u128)
                .unwrap()
                .checked_div(10000)
                .unwrap() as u64;
            
            // Transfer payout from market vault to user
            let seeds = &[
                b"market",
                &market.market_id.to_le_bytes()[..6],
                &[market.bump],
            ];
            let signer = &[&seeds[..]];
            
            let cpi_accounts = Transfer {
                from: ctx.accounts.market_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: market.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, payout)?;
            
            // Update user profile with Oracle Tokens
            user_profile.total_tokens += oracle_tokens_earned;
            user_profile.correct_predictions += 1;
            
            // Update category-specific stats
            let category_index = market.category as usize;
            if category_index < user_profile.category_tokens.len() {
                user_profile.category_tokens[category_index] += oracle_tokens_earned;
                user_profile.category_correct[category_index] += 1;
            }
            
            msg!("Claimed {} tokens and earned {} Oracle Tokens!", payout, oracle_tokens_earned);
        } else {
            // Wrong prediction - lose the stake
            msg!("Prediction was incorrect. No reward.");
        }
        
        prediction.claimed = true;
        Ok(())
    }

    /// Create user profile
    pub fn create_user_profile(ctx: Context<CreateUserProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;
        profile.user = ctx.accounts.user.key();
        profile.total_tokens = 0;
        profile.total_predictions = 0;
        profile.correct_predictions = 0;
        profile.total_volume = 0;
        profile.markets_created = 0;
        profile.category_tokens = vec![0; 8]; // 8 categories
        profile.category_correct = vec![0; 8];
        profile.created_at = Clock::get()?.unix_timestamp;
        profile.bump = ctx.bumps.user_profile;
        
        msg!("User profile created for {}", ctx.accounts.user.key());
        Ok(())
    }

    /// Vote on disputed market resolution
    pub fn dispute_vote(
        ctx: Context<DisputeVote>,
        proposed_option: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let voter_profile = &ctx.accounts.voter_profile;
        
        require!(
            market.status == MarketStatus::PendingResolution,
            ErrorCode::MarketNotInDispute
        );
        require!(
            voter_profile.total_tokens >= 100,
            ErrorCode::InsufficientVotingPower
        );
        
        // Implement dispute voting logic here
        // This would track votes and potentially slash tokens of incorrect voters
        
        msg!("Dispute vote cast for option {}", proposed_option);
        Ok(())
    }
}

// Helper functions
fn calculate_early_bird_bonus(
    prediction_time: i64,
    market_start: i64,
    market_end: i64,
) -> u64 {
    let time_into_market = prediction_time - market_start;
    let total_market_time = market_end - market_start;
    
    if total_market_time == 0 {
        return 100; // 1x multiplier
    }
    
    let ratio = (time_into_market as f64) / (total_market_time as f64);
    
    // Earlier predictions get higher bonus (up to 2x)
    // ratio = 0.0 (start) -> 200 (2x)
    // ratio = 1.0 (end) -> 100 (1x)
    let bonus = 200 - (ratio * 100.0) as u64;
    bonus.max(100).min(200)
}

fn calculate_difficulty_score(correct_volume: u64, total_volume: u64) -> u64 {
    if total_volume == 0 {
        return 100;
    }
    
    let ratio = (correct_volume as f64) / (total_volume as f64);
    
    // Contrarian bets (minority) get higher rewards
    // 10% correct -> 300 (3x)
    // 50% correct -> 100 (1x)
    // 90% correct -> 55 (0.55x)
    if ratio < 0.5 {
        ((1.0 / ratio) * 100.0) as u64
    } else {
        ((1.0 - ratio) * 100.0 + 50.0) as u64
    }
}

// Account structures
#[account]
pub struct PlatformState {
    pub authority: Pubkey,
    pub oracle_token_mint: Pubkey,
    pub platform_fee_bps: u16,
    pub total_markets: u64,
    pub bump: u8,
}

#[account]
pub struct Market {
    pub market_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub category: MarketCategory,
    pub options: Vec<String>,
    pub option_votes: Vec<u64>,
    pub resolution_timestamp: i64,
    pub status: MarketStatus,
    pub total_volume: u64,
    pub correct_option_index: Option<u8>,
    pub resolver: Option<Pubkey>,
    pub resolved_at: Option<i64>,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct Prediction {
    pub user: Pubkey,
    pub market: Pubkey,
    pub option_index: u8,
    pub amount: u64,
    pub timestamp: i64,
    pub claimed: bool,
    pub bump: u8,
}

#[account]
pub struct UserProfile {
    pub user: Pubkey,
    pub total_tokens: u64,
    pub total_predictions: u64,
    pub correct_predictions: u64,
    pub total_volume: u64,
    pub markets_created: u64,
    pub category_tokens: Vec<u64>,    // Tokens per category
    pub category_correct: Vec<u64>,   // Correct predictions per category
    pub created_at: i64,
    pub bump: u8,
}

// Context structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 2 + 8 + 1,
        seeds = [b"platform"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub oracle_token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 8 + 32 + 200 + 500 + 1 + 400 + 400 + 8 + 1 + 8 + 1 + 33 + 9 + 8 + 1,
        seeds = [b"market", &market_id.to_le_bytes()[..6]],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"profile", creator.key().as_ref()],
        bump = creator_profile.bump
    )]
    pub creator_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform_state.bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MakePrediction<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 1 + 8 + 8 + 1 + 1,
        seeds = [b"prediction", user.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub prediction: Account<'info, Prediction>,
    
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub market_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        seeds = [b"profile", resolver.key().as_ref()],
        bump = resolver_profile.bump
    )]
    pub resolver_profile: Account<'info, UserProfile>,
    
    pub resolver: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub prediction: Account<'info, Prediction>,
    
    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        seeds = [b"platform"],
        bump = platform_state.bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub market_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateUserProfile<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 200 + 200 + 8 + 1,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DisputeVote<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        seeds = [b"profile", voter.key().as_ref()],
        bump = voter_profile.bump
    )]
    pub voter_profile: Account<'info, UserProfile>,
    
    pub voter: Signer<'info>,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MarketStatus {
    Active,
    PendingResolution,
    Resolved,
    Disputed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketCategory {
    Sports = 0,
    Politics = 1,
    Crypto = 2,
    Entertainment = 3,
    Technology = 4,
    Economics = 5,
    Science = 6,
    Other = 7,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid number of options. Must be between 2 and 10.")]
    InvalidOptionsCount,
    #[msg("Resolution time must be in the future.")]
    InvalidResolutionTime,
    #[msg("Title is too long. Maximum 200 characters.")]
    TitleTooLong,
    #[msg("Insufficient tokens to create market. Need at least 1000 Oracle Tokens.")]
    InsufficientTokensToCreateMarket,
    #[msg("Market is not active.")]
    MarketNotActive,
    #[msg("Market has expired.")]
    MarketExpired,
    #[msg("Invalid option index.")]
    InvalidOption,
    #[msg("Market has not expired yet.")]
    MarketNotExpired,
    #[msg("Insufficient resolver credentials. Need Oracle status (10,000+ tokens).")]
    InsufficientResolverCredentials,
    #[msg("Market is not resolved yet.")]
    MarketNotResolved,
    #[msg("Reward already claimed.")]
    AlreadyClaimed,
    #[msg("Unauthorized.")]
    Unauthorized,
    #[msg("Market is not in dispute state.")]
    MarketNotInDispute,
    #[msg("Insufficient voting power. Need at least 100 tokens.")]
    InsufficientVotingPower,
}
