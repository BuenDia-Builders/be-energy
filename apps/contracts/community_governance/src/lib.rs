#![no_std]

//! # Community Governance Contract
//!
//! Sistema de gobernanza comunitaria para toma de decisiones del Hive.

use soroban_sdk::{contract, contractimpl, contracterror, contracttype, Address, Env, String};

const INSTANCE_TTL_THRESHOLD: u32 = 50_000;
const INSTANCE_TTL_EXTEND_TO: u32 = 100_000;
const PERSISTENT_TTL_THRESHOLD: u32 = 50_000;
const PERSISTENT_TTL_EXTEND_TO: u32 = 200_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GovernanceError {
    AlreadyInitialized = 1,
    CounterOverflow = 2,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub proposer: Address,
    pub votes_for: u32,
    pub votes_against: u32,
}

#[contracttype]
pub enum DataKey {
    Admin,
    ProposalCount,
    Proposal(u32),
}

#[contract]
pub struct CommunityGovernance;

#[contractimpl]
impl CommunityGovernance {
    pub fn initialize(env: Env, admin: Address) -> Result<(), GovernanceError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(GovernanceError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ProposalCount, &0u32);

        env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        Ok(())
    }

    pub fn create_proposal(env: Env, proposer: Address, title: String) -> Result<u32, GovernanceError> {
        proposer.require_auth();
        let count: u32 = env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0);
        let id = count.checked_add(1).ok_or(GovernanceError::CounterOverflow)?;

        let proposal = Proposal {
            id,
            title,
            proposer,
            votes_for: 0,
            votes_against: 0,
        };

        let proposal_key = DataKey::Proposal(id);
        env.storage().persistent().set(&proposal_key, &proposal);
        env.storage().persistent().extend_ttl(&proposal_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);

        env.storage().instance().set(&DataKey::ProposalCount, &id);
        env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        Ok(id)
    }

    pub fn get_proposal_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0)
    }

    pub fn get_proposal(env: Env, id: u32) -> Option<Proposal> {
        env.storage().persistent().get(&DataKey::Proposal(id))
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    fn setup<'a>(env: &'a Env) -> (CommunityGovernanceClient<'a>, Address) {
        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(env, &contract_id);
        let admin = Address::generate(env);
        let _ = client.try_initialize(&admin);
        (client, admin)
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(&env, &contract_id);
        let admin = Address::generate(&env);

        let result = client.try_initialize(&admin);
        assert!(result.is_ok());
        assert_eq!(client.get_proposal_count(), 0);
    }

    #[test]
    fn test_reinitialize_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);

        let result = client.try_initialize(&admin);
        assert!(result.is_err());
    }

    #[test]
    fn test_reinitialize_with_different_admin_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);

        let other_admin = Address::generate(&env);
        let result = client.try_initialize(&other_admin);
        assert!(result.is_err());
    }

    // ========================================================================
    // Proposals
    // ========================================================================

    #[test]
    fn test_create_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);

        let id = client.try_create_proposal(&proposer, &String::from_str(&env, "Install solar panels")).unwrap().unwrap();

        assert_eq!(id, 1);
        assert_eq!(client.get_proposal_count(), 1);
    }

    #[test]
    fn test_create_multiple_proposals() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);

        let id1 = client.try_create_proposal(&proposer, &String::from_str(&env, "Proposal A")).unwrap().unwrap();
        let id2 = client.try_create_proposal(&proposer, &String::from_str(&env, "Proposal B")).unwrap().unwrap();
        let id3 = client.try_create_proposal(&proposer, &String::from_str(&env, "Proposal C")).unwrap().unwrap();

        assert_eq!(id1, 1);
        assert_eq!(id2, 2);
        assert_eq!(id3, 3);
        assert_eq!(client.get_proposal_count(), 3);
    }

    #[test]
    fn test_proposal_data_stored_correctly() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let title = String::from_str(&env, "Buy new inverters");

        let id = client.try_create_proposal(&proposer, &title).unwrap().unwrap();

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.id, id);
        assert_eq!(proposal.title, title);
        assert_eq!(proposal.proposer, proposer);
        assert_eq!(proposal.votes_for, 0);
        assert_eq!(proposal.votes_against, 0);
    }

    #[test]
    fn test_different_proposers() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer1 = Address::generate(&env);
        let proposer2 = Address::generate(&env);

        let id1 = client.try_create_proposal(&proposer1, &String::from_str(&env, "From user 1")).unwrap().unwrap();
        let id2 = client.try_create_proposal(&proposer2, &String::from_str(&env, "From user 2")).unwrap().unwrap();

        let p1 = client.get_proposal(&id1).unwrap();
        let p2 = client.get_proposal(&id2).unwrap();
        assert_eq!(p1.proposer, proposer1);
        assert_eq!(p2.proposer, proposer2);
    }

    #[test]
    fn test_get_nonexistent_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);

        assert_eq!(client.get_proposal(&999), None);
    }

    // ========================================================================
    // Edge Cases
    // ========================================================================

    #[test]
    fn test_proposal_count_before_initialize() {
        let env = Env::default();
        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(&env, &contract_id);

        assert_eq!(client.get_proposal_count(), 0);
    }

    #[test]
    fn test_sequential_ids_never_skip() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);

        for expected_id in 1u32..=10 {
            let id = client.try_create_proposal(&proposer, &String::from_str(&env, "test")).unwrap().unwrap();
            assert_eq!(id, expected_id);
        }
        assert_eq!(client.get_proposal_count(), 10);
    }

    #[test]
    fn test_get_proposal_id_zero_returns_none() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);

        // IDs start at 1, so ID 0 should never exist
        assert_eq!(client.get_proposal(&0), None);
    }

    #[test]
    fn test_counter_overflow_returns_error() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let _ = client.try_initialize(&admin);
        let proposer = Address::generate(&env);

        // Manually set the counter to u32::MAX
        env.as_contract(&contract_id, || {
            env.storage().instance().set(&DataKey::ProposalCount, &u32::MAX);
        });

        let result = client.try_create_proposal(&proposer, &String::from_str(&env, "overflow"));
        assert!(result.is_err());
    }
}
