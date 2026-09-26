SCF Build Award — Submission Draft
Track
Integration — Hardware integration & testing (solar panel + smart meter + LoRaWAN gateway)

Title
BeEnergy: Hardware-to-Blockchain Pipeline for Community Solar Trading

Project URL
https://github.com/BuenDia-Builders/be-energy

Architecture / Demo URL
https://be-energy-six.vercel.app

Elevator Pitch
BeEnergy connects physical solar infrastructure to the Stellar blockchain so neighbors can actually trade the energy they produce. The smart contracts, the backend, and the frontend are already built and working end to end. What's missing is the hardware bridge — a real smart meter on someone's roof feeding data into our on-chain minting pipeline. This grant funds that last mile.

What does this project do?
BeEnergy is a peer-to-peer energy marketplace for cooperative housing communities. Homes with solar panels tokenize their surplus generation as HoneyDrops (HDROP) — 1 kWh equals 1 token — and trade them directly with neighbors through Soroban smart contracts.

The full software stack works today:

3 Soroban contracts on testnet (EnergyToken, EnergyDistribution, CommunityGovernance)
Backend with Supabase (prosumer registration, energy readings, token minting)
End-to-end minting verified: reading goes in, HDROP tokens come out on Stellar
Frontend dashboard, marketplace, and governance UI connected to live contract data
What we haven't done is plug in real hardware. Today, readings enter through the API manually. For this to work in the real world, a smart meter needs to measure actual solar production, send that data over LoRaWAN to a gateway, and the gateway pushes it to our backend — which already knows what to do with it.

Why Stellar?
We didn't pick Stellar because it was trendy. We picked it because the economics of energy trading demand it.

Every energy trade is a microtransaction. A home that produces 8 kWh of surplus solar and sells it to a neighbor for $0.80 can't afford $2 in gas fees. On Ethereum or Solana during congestion, that trade doesn't make sense. On Stellar, the transaction fee is 0.00001 XLM — essentially free. That's not a nice-to-have, it's the difference between a viable product and a demo.

Speed matters for daily settlement. Our system mints tokens every day based on real energy production. Stellar settles in 5 seconds with deterministic finality. There's no "pending" state, no reorgs, no wondering if the mint went through. For non-crypto users checking their dashboard in the morning, that reliability is everything.

Soroban gives us programmable logic without the cost. Our three contracts handle token minting (SEP-41 compliant), multi-sig energy distribution, and community governance voting. Soroban's resource model means these operations stay cheap even as we scale. The OpenZeppelin Stellar library gave us battle-tested building blocks.

The built-in DEX opens future liquidity. Right now neighbors trade HDROP within their community. Eventually, HDROP could trade against XLM or USDC on Stellar's native DEX — no external exchange integration needed. A community with surplus tokens could sell them to anyone on the network.

Stellar's mission aligns with ours. Financial inclusion for underserved communities isn't just marketing copy for Stellar — it's built into the protocol design. Cooperative housing communities in Spain and Latin America are exactly the kind of users the network was designed to serve: real people making real economic transactions, not traders chasing yield.

What makes this project different?
Most blockchain energy projects stop at the dashboard. They show pretty charts and promise decentralization but never touch a physical wire. We're going the other way: start from the meter, end at the token.

The software already works. We're not asking for money to build an idea — the full pipeline from prosumer registration to on-chain minting is verified. We're asking for money to connect it to physical infrastructure.

We target cooperatives, not individuals. A single home with solar panels is interesting. A group of 5-10 homes sharing a Hive with transparent distribution rules is a business. Cooperative housing is growing fast in Spain and Latin America, and these communities already share infrastructure — they just don't have the tools to share energy fairly.

LoRaWAN makes it cheap. Cellular connectivity per meter is expensive and overkill. A single LoRaWAN gateway covers a small community, and pulse-counting sensors cost a fraction of full smart meters. The total hardware cost for a 5-home pilot is under $1,500.

How does this project benefit the Stellar ecosystem?
Every kWh traded through BeEnergy is a Stellar transaction. For a 5-home pilot generating and trading daily, that's roughly 150 transactions per month — small, but real and recurring. Scale to 50 communities and you're looking at thousands of organic, non-speculative transactions per day.

More importantly, this is the kind of use case that makes blockchain tangible for normal people. A neighbor who sees their solar tokens arrive every morning doesn't need to understand Soroban — they just know the system works. That's how you get adoption outside the crypto-native crowd.

The SEP-41 compliant HDROP token means any Stellar wallet can hold and transfer energy tokens. The integration track specifically fits because we're connecting physical infrastructure (solar panels, meters, gateways) to Stellar through Soroban contracts. This isn't a DeFi protocol — it's a real-world pipeline from photons to tokens.

Hardware Comparison — Smart Meters & Gateways
We researched the current market for LoRaWAN-compatible pulse-counting sensors and gateways suitable for reading bidirectional energy meters.

Pulse Counter Sensors
Device	Price (USD)	Notes
Dragino LT-22222-L	~$55–75	Multi-I/O, can read pulse meters
Linovision LoRaWAN Pulse Counter	~$69	Budget option, basic pulse counting
Milesight EM300-DI / UC50x series	~$80–120	Mid-range, reliable, good documentation
TEKTELIC KONA Pulse	~$150–200	Enterprise, certified, long range
Innon Pulse Reader (PulseReader+)	~$234	Industrial grade, high accuracy
LoRaWAN Gateways
Device	Price (USD)	Notes
Dragino LPS8v2	~$99–139	Budget indoor gateway, popular in community projects
RAK WisGate Edge Lite 2	~$99–139	Budget entry, indoor, good for prototyping
RAK WisGate Edge Pro	~$199–322	Outdoor, better range, carrier grade
Milesight UG65/UG67	~$299–499	Industrial outdoor, built-in LTE backup
Kerlink Wirnet iStation	~$500–769	Carrier-grade, outdoor, long range
Pilot Cost Estimate (5 homes)
Item	Qty	Unit Cost	Total
Pulse counter sensor (mid-range)	5	~$100	~$500
LoRaWAN gateway (outdoor)	1	~$250	~$250
Cabling, enclosures, installation	5	~$50	~$250
Subtotal			~$1,000
For a second pilot (10 homes): ~$1,800–2,200.

Team
3 developers (full-stack, blockchain, hardware integration)
2 product managers (community relations, operations)
External contractors as needed for hardware installation and LoRaWAN network setup
The team works at partial compensation because we believe in this project. We're building BeEnergy because we want cooperative communities to have real tools for energy independence — the grant supplements our commitment, it doesn't replace it.

Budget Breakdown — $55,000
Category	Amount	Details
Team compensation (5 members × $800/mo × 9 months)	$36,000	Partial compensation — team co-invests time in the project
Hardware procurement (2 pilots)	$3,500	Sensors, gateways, cabling for 5+10 home pilots
External contractors	$5,500	Hardware installation, electrical work, LoRaWAN network setup
Contract audit + mainnet deployment	$6,000	Professional security audit, mainnet gas reserve
Community onboarding	$2,000	User training, documentation, support during pilots
Contingency	$2,000	Unexpected costs, replacement hardware, shipping
Total	$55,000	
Tranches — Proposed Timeline
Context: As of March 2026, the full software stack is complete — smart contracts on testnet, Supabase backend with verified end-to-end minting, and the frontend connected to live contract data. This grant starts from hardware integration forward.

Tranche 1 — $5,500 (10%) — May 2026
Deliverable: Hardware procured and working in lab environment

LoRaWAN gateway + 2 pulse counter sensors purchased, received, and assembled
Sensor → Gateway → BeEnergy API pipeline operational on a bench test
Backend receives hardware readings and auto-triggers HDROP minting (testnet)
Data validation layer: sanity checks on kWh values, duplicate detection, tamper alerts
Hardware setup documentation written
Why this timeline: Procurement takes 2-4 weeks depending on supplier. Lab integration is straightforward — our API already accepts readings, we just need to format the LoRaWAN payload correctly. The backend and minting pipeline don't change.

Tranche 2 — $11,000 (20%) — July 2026
Deliverable: First community pilot (5 homes) live on testnet

5 pulse sensors installed on real solar meters in a cooperative community
1 outdoor LoRaWAN gateway covering the Hive
Prosumers registered, daily readings flowing automatically from hardware
HDROP tokens minting daily from real solar production (testnet)
Community members using the dashboard to track their generation and trades
Contract security audit initiated
Bug fixes and UX improvements based on real user feedback
Why this timeline: We'll have validated the full pipeline in Tranche 1. This tranche is about coordinating with a real community — scheduling installations, training users, and iterating based on what breaks. Cooperatives move on their own schedule, so we budget 8-10 weeks.

Tranche 3 — $16,500 (30%) — October 2026
Deliverable: Mainnet deployment + pilot migrated to production

Contract audit completed and issues resolved
All 3 contracts deployed on Stellar mainnet
First pilot community migrated from testnet to mainnet
Real HDROP tokens minting and trading on mainnet from live solar data
Multi-sig custody for minting keys (using EnergyDistribution contract's existing multi-sig support)
Monitoring and alerting for hardware pipeline health
Performance metrics published: kWh tokenized, transactions settled, uptime
Why this timeline: The audit is the bottleneck — typically 4-6 weeks including remediation. Once that's done, mainnet deployment is a configuration change. We want at least one month of mainnet operation before scaling.

Tranche 4 — $22,000 (40%) — January 2027
Deliverable: Second pilot (10 homes) + community scale playbook

Second cooperative community onboarded (10 homes, different location)
Additional gateway + 10 sensors installed and operational on mainnet
Both communities actively trading HDROP tokens
Open-source hardware integration guide published (sensor setup, gateway config, API integration)
Post-pilot report with real metrics: total kWh traded, XLM transaction volume, estimated savings per household, hardware reliability data
Community onboarding playbook for future cooperatives
Why this timeline: The second pilot proves the model works beyond one community. Different location means different solar patterns, different meters, possibly different regulatory context. This is where we learn what's truly repeatable.

Gaps to Mainnet
Contract security audit. Our contracts use OpenZeppelin Stellar, which provides audited building blocks, but a professional review of our specific logic is required before mainnet. Budgeted at $4,000–6,000.

Hardware reliability. Pulse sensors in outdoor enclosures need to survive weather. The first pilot will reveal if our mid-range sensor choice holds up long-term or if we need to invest in industrial-grade alternatives.

Regulatory clarity. P2P energy trading regulations vary by country. Our first pilot targets Spain, where cooperative energy communities have existing legal framework. Latin American pilots will need local regulatory review.

Key management. Currently the backend signs minting transactions with a single server-side keypair. For mainnet we need multi-sig custody — the EnergyDistribution contract already supports this, it just needs to be wired up for the minting flow.

Gateway coverage. One LoRaWAN gateway covers ~2km radius. For communities spread further apart, we may need additional gateways or mesh networking. The pilot will inform network topology decisions.

Links
Live app: https://be-energy-six.vercel.app
GitHub: https://github.com/BuenDia-Builders/be-energy
Hackathon: https://dorahacks.io/buidl/36793
Backend setup limitations: docs-vs-code audit (the former docs/backend-setup.md is absent)