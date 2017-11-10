# Test procedure
Complete test procedure with asserts and events, grouped by test cases.

## IcoToken

### Instantiate the ICO token correctly
- owner should be account[0]
- owner should be a treasurer

###  Add treasurer accounts
- activeTreasurer1 should be active
- activeTreasurer2 should be active
- activeTreasurer3 should be active
- activeTreasurer4 should be active

#### Events
- activeTreasurer1 address from event should match with accounts[1]
- activeTreasurer1 active state from event should be true
- activeTreasurer2 address from event should match with accounts[2]
- activeTreasurer2 active state from event should be true
- inactiveTreasurer1 address from event should match with accounts[3]
- inactiveTreasurer1 active state from event should be false
- inactiveTreasurer2 address from event should match with accounts[4]
- inactiveTreasurer2 active state from event should be false

### Mint 5 tokens for each token holder
- Balance of tokenHolder1 should be 0 initially
- Balance of tokenHolder2 should be 0 initially
- Balance of tokenHolder3 should be 0 initially
- totalSupply should be 0 initially



## IcoCrowdsale
