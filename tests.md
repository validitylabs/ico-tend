# Test procedure
Complete test procedure with asserts and events, grouped by test cases.

## IcoToken

### Instantiate the ICO token correctly
- owner should be account[0]
- owner should be a treasurer

### Fail, because we try to transfer on a paused contract
- Transfer from tokenHolder1 to tokenHolder2

### Unpause ICO token correctly
- Call unpause() from owner account
- Events
    - Excpet events is an array
    - Expect events length === 1

###  Add treasurer accounts
- Call setTreasurer(activeTreasurer1, true)
    - activeTreasurer1 should be active
- Call setTreasurer(activeTreasurer2, true)
    - activeTreasurer2 should be active
- Call setTreasurer(inactiveTreasurer1, false)
    - inactiveTreasurer1 should be inactive
- Call setTreasurer(inactiveTreasurer2, false)
    - inactiveTreasurer2 should be inactive
- Unpause events
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
- Call icoTokenInstance.mint(tokenHolder1, 5)
    - balanceOf(tokenHolder1) should be 5
- Call icoTokenInstance.mint(tokenHolder2, 5)
    - balanceOf(tokenHolder2) should be 5
- Call icoTokenInstance.mint(tokenHolder3, 5)
    - balanceOf(tokenHolder3) should be 5
- totalSupply should be 15





## IcoCrowdsale
