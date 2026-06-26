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
    ProposalNotFound = 2,
    AlreadyVoted = 3,
    ProposalNotPending = 4,
    QuorumNotReached = 5,
    ProposalNotApproved = 6,
    ProposalAlreadyExecuted = 7,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ProposalStatus {
    Pending,
    Approved,
    Rejected,
    Executed,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub proposer: Address,
    pub votes_for: u32,
    pub votes_against: u32,
    pub status: ProposalStatus,
}

#[contracttype]
pub enum DataKey {
    Admin,
    ProposalCount,
    QuorumVotes,
    Proposal(u32),
    Vote(u32, Address),
}

#[contract]
pub struct CommunityGovernance;

#[contractimpl]
impl CommunityGovernance {
    pub fn initialize(env: Env, admin: Address, quorum_votes: u32) -> Result<(), GovernanceError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(GovernanceError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ProposalCount, &0u32);
        env.storage().instance().set(&DataKey::QuorumVotes, &quorum_votes);

        env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        Ok(())
    }

    pub fn create_proposal(env: Env, proposer: Address, title: String) -> u32 {
        proposer.require_auth();
        let count: u32 = env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0);
        let id = count + 1;

        let proposal = Proposal {
            id,
            title,
            proposer,
            votes_for: 0,
            votes_against: 0,
            status: ProposalStatus::Pending,
        };

        let proposal_key = DataKey::Proposal(id);
        env.storage().persistent().set(&proposal_key, &proposal);
        env.storage().persistent().extend_ttl(&proposal_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);

        env.storage().instance().set(&DataKey::ProposalCount, &id);
        env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        id
    }

    pub fn vote(env: Env, proposal_id: u32, voter: Address, in_favor: bool) -> Result<(), GovernanceError> {
        voter.require_auth();

        let proposal_key = DataKey::Proposal(proposal_id);
        let mut proposal: Proposal = env.storage().persistent()
            .get(&proposal_key)
            .ok_or(GovernanceError::ProposalNotFound)?;

        if proposal.status != ProposalStatus::Pending {
            return Err(GovernanceError::ProposalNotPending);
        }

        let vote_key = DataKey::Vote(proposal_id, voter.clone());
        if env.storage().persistent().has(&vote_key) {
            return Err(GovernanceError::AlreadyVoted);
        }

        env.storage().persistent().set(&vote_key, &in_favor);
        env.storage().persistent().extend_ttl(&vote_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);

        if in_favor {
            proposal.votes_for += 1;
        } else {
            proposal.votes_against += 1;
        }

        let quorum_votes: u32 = env.storage().instance().get(&DataKey::QuorumVotes).unwrap_or(0);
        let total_votes = proposal.votes_for + proposal.votes_against;

        if total_votes >= quorum_votes {
            if proposal.votes_for > proposal.votes_against {
                proposal.status = ProposalStatus::Approved;
            } else {
                proposal.status = ProposalStatus::Rejected;
            }
        }

        env.storage().persistent().set(&proposal_key, &proposal);
        env.storage().persistent().extend_ttl(&proposal_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);
        env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);

        Ok(())
    }

    pub fn execute_proposal(env: Env, proposal_id: u32) -> Result<(), GovernanceError> {
        let proposal_key = DataKey::Proposal(proposal_id);
        let mut proposal: Proposal = env.storage().persistent()
            .get(&proposal_key)
            .ok_or(GovernanceError::ProposalNotFound)?;

        match proposal.status {
            ProposalStatus::Approved => {
                proposal.status = ProposalStatus::Executed;
                env.storage().persistent().set(&proposal_key, &proposal);
                env.storage().persistent().extend_ttl(&proposal_key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_EXTEND_TO);
                env.storage().instance().extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_EXTEND_TO);
                Ok(())
            }
            ProposalStatus::Pending => Err(GovernanceError::QuorumNotReached),
            ProposalStatus::Rejected => Err(GovernanceError::ProposalNotApproved),
            ProposalStatus::Executed => Err(GovernanceError::ProposalAlreadyExecuted),
        }
    }

    pub fn get_proposal_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0)
    }

    pub fn get_proposal(env: Env, id: u32) -> Option<Proposal> {
        env.storage().persistent().get(&DataKey::Proposal(id))
    }

    pub fn get_quorum_votes(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::QuorumVotes).unwrap_or(0)
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
        let _ = client.try_initialize(&admin, &5);
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

        let result = client.try_initialize(&admin, &5);
        assert!(result.is_ok());
        assert_eq!(client.get_proposal_count(), 0);
        assert_eq!(client.get_quorum_votes(), 5);
    }

    #[test]
    fn test_reinitialize_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, admin) = setup(&env);

        let result = client.try_initialize(&admin, &5);
        assert!(result.is_err());
    }

    #[test]
    fn test_reinitialize_with_different_admin_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);

        let other_admin = Address::generate(&env);
        let result = client.try_initialize(&other_admin, &5);
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

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Install solar panels"));

        assert_eq!(id, 1);
        assert_eq!(client.get_proposal_count(), 1);
    }

    #[test]
    fn test_create_multiple_proposals() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);

        let id1 = client.create_proposal(&proposer, &String::from_str(&env, "Proposal A"));
        let id2 = client.create_proposal(&proposer, &String::from_str(&env, "Proposal B"));
        let id3 = client.create_proposal(&proposer, &String::from_str(&env, "Proposal C"));

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

        let id = client.create_proposal(&proposer, &title);

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.id, id);
        assert_eq!(proposal.title, title);
        assert_eq!(proposal.proposer, proposer);
        assert_eq!(proposal.votes_for, 0);
        assert_eq!(proposal.votes_against, 0);
        assert_eq!(proposal.status, ProposalStatus::Pending);
    }

    #[test]
    fn test_different_proposers() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer1 = Address::generate(&env);
        let proposer2 = Address::generate(&env);

        let id1 = client.create_proposal(&proposer1, &String::from_str(&env, "From user 1"));
        let id2 = client.create_proposal(&proposer2, &String::from_str(&env, "From user 2"));

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
    // Voting
    // ========================================================================

    #[test]
    fn test_vote_in_favor() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));
        let result = client.try_vote(&id, &voter, &true);
        assert!(result.is_ok());

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.votes_for, 1);
        assert_eq!(proposal.votes_against, 0);
        assert_eq!(proposal.status, ProposalStatus::Pending);
    }

    #[test]
    fn test_vote_against() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));
        let result = client.try_vote(&id, &voter, &false);
        assert!(result.is_ok());

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.votes_for, 0);
        assert_eq!(proposal.votes_against, 1);
    }

    #[test]
    fn test_same_address_cannot_vote_twice() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));
        let _ = client.try_vote(&id, &voter, &true);
        let result = client.try_vote(&id, &voter, &false);
        assert_eq!(result, Err(Ok(GovernanceError::AlreadyVoted)));
    }

    #[test]
    fn test_cannot_vote_on_nonexistent_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let voter = Address::generate(&env);

        let result = client.try_vote(&999, &voter, &true);
        assert_eq!(result, Err(Ok(GovernanceError::ProposalNotFound)));
    }

    #[test]
    fn test_multiple_voters_on_same_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter1 = Address::generate(&env);
        let voter2 = Address::generate(&env);
        let voter3 = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        assert!(client.try_vote(&id, &voter1, &true).is_ok());
        assert!(client.try_vote(&id, &voter2, &true).is_ok());
        assert!(client.try_vote(&id, &voter3, &false).is_ok());

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.votes_for, 2);
        assert_eq!(proposal.votes_against, 1);
    }

    #[test]
    fn test_vote_on_different_proposals_independent() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);
        let proposer = Address::generate(&env);
        let voter = Address::generate(&env);

        let id1 = client.create_proposal(&proposer, &String::from_str(&env, "A"));
        let id2 = client.create_proposal(&proposer, &String::from_str(&env, "B"));

        assert!(client.try_vote(&id1, &voter, &true).is_ok());
        assert!(client.try_vote(&id2, &voter, &false).is_ok());

        let p1 = client.get_proposal(&id1).unwrap();
        let p2 = client.get_proposal(&id2).unwrap();
        assert_eq!(p1.votes_for, 1);
        assert_eq!(p2.votes_against, 1);
    }

    // ========================================================================
    // Quorum & Approval
    // ========================================================================

    #[test]
    fn test_proposal_approved_when_quorum_reached_and_majority_for() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env); // quorum = 5
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        for _ in 0..5 {
            let voter = Address::generate(&env);
            let _ = client.try_vote(&id, &voter, &true);
        }

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.status, ProposalStatus::Approved);
    }

    #[test]
    fn test_proposal_rejected_when_quorum_reached_and_tied() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let _ = client.try_initialize(&admin, &4);
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        // 2 for, 2 against -> tie -> rejected
        for i in 0..4 {
            let voter = Address::generate(&env);
            let _ = client.try_vote(&id, &voter, &(i < 2));
        }

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.status, ProposalStatus::Rejected);
    }

    #[test]
    fn test_proposal_rejected_when_quorum_reached_and_majority_against() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env); // quorum = 5
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        for _ in 0..5 {
            let voter = Address::generate(&env);
            let _ = client.try_vote(&id, &voter, &false);
        }

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.status, ProposalStatus::Rejected);
    }

    #[test]
    fn test_proposal_stays_pending_before_quorum_reached() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env); // quorum = 5
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        for _ in 0..4 {
            let voter = Address::generate(&env);
            let _ = client.try_vote(&id, &voter, &true);
        }

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.status, ProposalStatus::Pending);
    }

    // ========================================================================
    // Execution
    // ========================================================================

    #[test]
    fn test_cannot_execute_pending_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env); // quorum = 5
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));
        // Only 1 vote, not enough quorum
        let voter = Address::generate(&env);
        let _ = client.try_vote(&id, &voter, &true);

        let result = client.try_execute_proposal(&id);
        assert_eq!(result, Err(Ok(GovernanceError::QuorumNotReached)));
    }

    #[test]
    fn test_cannot_execute_rejected_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env); // quorum = 5
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        for _ in 0..5 {
            let voter = Address::generate(&env);
            let _ = client.try_vote(&id, &voter, &false);
        }

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.status, ProposalStatus::Rejected);

        let result = client.try_execute_proposal(&id);
        assert_eq!(result, Err(Ok(GovernanceError::ProposalNotApproved)));
    }

    #[test]
    fn test_approved_proposal_can_be_executed() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env); // quorum = 5
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        for _ in 0..5 {
            let voter = Address::generate(&env);
            let _ = client.try_vote(&id, &voter, &true);
        }

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.status, ProposalStatus::Approved);

        let result = client.try_execute_proposal(&id);
        assert!(result.is_ok());

        let proposal = client.get_proposal(&id).unwrap();
        assert_eq!(proposal.status, ProposalStatus::Executed);
    }

    #[test]
    fn test_already_executed_proposal_cannot_be_executed_again() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env); // quorum = 5
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        for _ in 0..5 {
            let voter = Address::generate(&env);
            let _ = client.try_vote(&id, &voter, &true);
        }

        let _ = client.try_execute_proposal(&id);
        let result = client.try_execute_proposal(&id);
        assert_eq!(result, Err(Ok(GovernanceError::ProposalAlreadyExecuted)));
    }

    #[test]
    fn test_cannot_execute_nonexistent_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env);

        let result = client.try_execute_proposal(&999);
        assert_eq!(result, Err(Ok(GovernanceError::ProposalNotFound)));
    }

    // ========================================================================
    // Status Transitions
    // ========================================================================

    #[test]
    fn test_full_status_lifecycle() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env); // quorum = 5
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        // 1. Starts as Pending
        assert_eq!(client.get_proposal(&id).unwrap().status, ProposalStatus::Pending);

        // Vote 1: still Pending (only 1/5 votes)
        let v1 = Address::generate(&env);
        let _ = client.try_vote(&id, &v1, &true);
        assert_eq!(client.get_proposal(&id).unwrap().status, ProposalStatus::Pending);

        // Vote 2: still Pending (only 2/5 votes)
        let v2 = Address::generate(&env);
        let _ = client.try_vote(&id, &v2, &true);
        assert_eq!(client.get_proposal(&id).unwrap().status, ProposalStatus::Pending);

        // Vote 5: quorum reached (5/5) -> Approved
        for _ in 2..5 {
            let v = Address::generate(&env);
            let _ = client.try_vote(&id, &v, &true);
        }
        assert_eq!(client.get_proposal(&id).unwrap().status, ProposalStatus::Approved);

        // Execute -> Executed
        let _ = client.try_execute_proposal(&id);
        assert_eq!(client.get_proposal(&id).unwrap().status, ProposalStatus::Executed);
    }

    #[test]
    fn test_cannot_vote_on_non_pending_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        let (client, _) = setup(&env); // quorum = 5
        let proposer = Address::generate(&env);

        let id = client.create_proposal(&proposer, &String::from_str(&env, "Test"));

        // Reach quorum and approve
        for _ in 0..5 {
            let voter = Address::generate(&env);
            let _ = client.try_vote(&id, &voter, &true);
        }

        // Execute
        let _ = client.try_execute_proposal(&id);
        assert_eq!(client.get_proposal(&id).unwrap().status, ProposalStatus::Executed);

        // Try to vote on executed proposal
        let late_voter = Address::generate(&env);
        let result = client.try_vote(&id, &late_voter, &true);
        assert_eq!(result, Err(Ok(GovernanceError::ProposalNotPending)));
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
            let id = client.create_proposal(&proposer, &String::from_str(&env, "test"));
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
    fn test_quorum_votes_returns_correct_value() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CommunityGovernance, ());
        let client = CommunityGovernanceClient::new(&env, &contract_id);
        let admin = Address::generate(&env);

        let _ = client.try_initialize(&admin, &10);
        assert_eq!(client.get_quorum_votes(), 10);
    }
}
