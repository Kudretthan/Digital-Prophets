#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, token};

// --- VERİ TİPLERİ ---

#[contracttype]
#[derive(Clone)]
pub struct Market {
    pub end_time: u64,
    pub resolved: bool,
    pub outcome: bool, // true: YES, false: NO
    pub total_yes: i128,
    pub total_no: i128,
    pub token: Address, // Bahis yapılan token (XLM veya USDC)
}

#[contracttype]
pub enum DataKey {
    Market(u64),             
    Bet(u64, Address),       
    Admin,                   
    MarketCount,             
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BetInfo {
    pub amount: i128,
    pub side: bool, 
    pub claimed: bool,
}

// --- KONTRAT ---

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {

    // 1. Kontratı Başlatma
    pub fn initialize(env: Env, admin: Address) {
        // Eğer admin zaten varsa tekrar başlatma
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::MarketCount, &0u64);
    }

    // 2. Yeni Market Açma
    pub fn create_market(env: Env, token: Address, end_time: u64) -> u64 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth(); // İmza kontrolü

        let mut count: u64 = env.storage().instance().get(&DataKey::MarketCount).unwrap_or(0);
        count += 1;

        let new_market = Market {
            end_time,
            resolved: false,
            outcome: false,
            total_yes: 0,
            total_no: 0,
            token,
        };

        env.storage().instance().set(&DataKey::Market(count), &new_market);
        env.storage().instance().set(&DataKey::MarketCount, &count);

        count
    }

    // 3. Bahis Yapma
    pub fn place_bet(env: Env, user: Address, market_id: u64, amount: i128, side: bool) {
        user.require_auth(); // Kullanıcıdan onay iste

        // Market var mı kontrol et
        let mut market: Market = env.storage().instance().get(&DataKey::Market(market_id)).expect("Market Not Found");
        
        if market.resolved {
            panic!("Market is already resolved");
        }
        
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Token Transferi: User -> Contract
        let token_client = token::Client::new(&env, &market.token);
        
        // ÖNEMLİ: Kullanıcı kontrata para gönderiyor
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // Havuzu güncelle
        if side {
            market.total_yes += amount;
        } else {
            market.total_no += amount;
        }

        // Bahsi kaydet (Basit versiyon: Kullanıcı tek bahis yapar)
        let bet_key = DataKey::Bet(market_id, user.clone());
        
        // Eğer daha önce bahis varsa üstüne ekle (Opsiyonel geliştirme)
        let new_bet = BetInfo { amount, side, claimed: false };
        
        env.storage().instance().set(&bet_key, &new_bet);
        env.storage().instance().set(&DataKey::Market(market_id), &market);
    }

    // 4. Sonuçlandırma
    pub fn resolve_market(env: Env, market_id: u64, outcome: bool) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut market: Market = env.storage().instance().get(&DataKey::Market(market_id)).expect("Market Not Found");
        market.resolved = true;
        market.outcome = outcome;

        env.storage().instance().set(&DataKey::Market(market_id), &market);
    }

    // 5. Kazanç Talep Etme
    pub fn claim_winnings(env: Env, user: Address, market_id: u64) {
        user.require_auth();

        let market: Market = env.storage().instance().get(&DataKey::Market(market_id)).expect("Market Not Found");
        if !market.resolved {
            panic!("Market not resolved yet");
        }

        let bet_key = DataKey::Bet(market_id, user.clone());
        let mut bet: BetInfo = env.storage().instance().get(&bet_key).expect("No bet found");

        if bet.claimed {
            panic!("Already claimed");
        }

        if bet.side != market.outcome {
            panic!("You lost");
        }

        // Ödül Hesaplama
        let total_pool = market.total_yes + market.total_no;
        let winning_pool = if market.outcome { market.total_yes } else { market.total_no };

        // Kazanan tarafta kimse yoksa paralar kilitli kalmasın (İade mantığı eklenebilir, şimdilik basit tutalım)
        if winning_pool == 0 {
             panic!("Winning pool is empty"); 
        }

        // Ödül Formülü: (Senin Paran * Toplam Havuz) / Kazanan Havuz
        let reward = (bet.amount * total_pool) / winning_pool;

        // Ödeme Yap: Contract -> User
        let token_client = token::Client::new(&env, &market.token);
        token_client.transfer(&env.current_contract_address(), &user, &reward);

        bet.claimed = true;
        env.storage().instance().set(&bet_key, &bet);
    }
}