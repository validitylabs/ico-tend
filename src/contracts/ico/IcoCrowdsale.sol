/**
 * @title IcoCrowdsale
 * Simple time and capped based crowdsale.
 *
 * @version 1.0
 * @author Patrice Juergens <pj@validitylabs.org>
 */
pragma solidity ^0.4.18;

import "../../../node_modules/zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IcoToken.sol";

contract IcoCrowdsale is Crowdsale, Ownable {
    // allow managers to whitelist and confirm contributions by manager accounts
    // (managers can be set and altered by owner, multiple manager accounts are possible
    mapping(address => bool) public isManager;

    // true if address is allowed to invest
    mapping(address => bool) public isWhitelisted;

    event ChangedInvestorWhitelisting(address investor, bool whitelisted);

    event ChangedManager(address manager, bool active);

    event ChangedInvestmentConfirmation(uint256 investmentId, address investor, bool confirmed);

    uint256 public confirmationPeriod = 0 days;

    uint256 public cap;

    uint256 public alreadyMinted = 0;           // already minted tokens (maximally = cap)

    bool public confirmationPeriodOver = false; // can be set by owner to finish confirmation in under 30 days
    /**
     * @dev Deploy capped ico crowdsale contract
     * @param _startTime uint256 Start time of the crowdsale
     * @param _endTime uint256 End time of the crowdsale
     * @param _rate uint256 Rate of crowdsale
     * @param _wallet address Wallet address of the crowdsale
     * @param _cap uint256 Crowdsale cap
     * @param _confirmationPeriodDays uint256 Confirmation period in days
     */
    function IcoCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, uint256 _cap, uint256 _confirmationPeriodDays)
        public
        Crowdsale(_startTime, _endTime, _rate, _wallet)
    {
        setManager(msg.sender, true);
        cap = _cap;
        confirmationPeriod = _confirmationPeriodDays * 1 days;
    }

    /**
     * @dev Create new instance of ico token contract
     */
    function createTokenContract() internal returns (MintableToken) {
        return new IcoToken();
    }

    /**
     * @dev Set / alter manager / whitelister "account". This can be done from owner only
     * @param manager address address of the manager to create/alter
     * @param active bool flag that shows if the manager account is active
     */
    function setManager(address manager, bool active) public onlyOwner {
        isManager[manager] = active;
        ChangedManager(manager, active);
    }

    function whiteListInvestor(address investor) public {
        require(isManager[msg.sender]);

        isWhitelisted[investor] = true;
        ChangedInvestorWhitelisting(investor, true);
    }

    function batchWhiteListInvestors(address[] investors) public {
        require(isManager[msg.sender]);

        address investor;

        for (uint256 c; c < investors.length; c = c.add(1)) {
            investor = investors[c]; // gas optimization
            isWhitelisted[investor] = true;
            ChangedInvestorWhitelisting(investor, true);
        }
    }

    function unWhiteListInvestor(address investor) public {
        require(isManager[msg.sender]);

        isWhitelisted[investor] = false;
        ChangedInvestorWhitelisting(investor, false);
    }

    // override so that funds do not get forwarded to beneficiary wallet
    // sending funds happens after crowdsale is over and confirmation period is over
    function forwardFunds() internal {}

    struct Payment {
        address investor;
        address beneficiary;
        uint256 amount;
        bool confirmed;
    }

    Payment[] public investments; // @TODO (Sebastian): or mapping better than array?

    // extend core functionality by whitelist check and registration of payment
    function buyTokens(address beneficiary) public payable {
        require(isWhitelisted[msg.sender]);

        // register payment so that later on it can be confirmed (and tokens issued and Ether paid out)
        Payment memory newPayment = Payment(msg.sender, beneficiary, msg.value, false);
        investments.push(newPayment);

        super.buyTokens(beneficiary);
    }

    function confirmPayment(uint256 investmentId) public {
        require(isManager[msg.sender]);
        require(now > endTime && now <= endTime.add(confirmationPeriod));

        investments[investmentId].confirmed = true;
        ChangedInvestmentConfirmation(investmentId, investments[investmentId].investor, true);
    }

    function batchConfirmPayments(uint256[] investmentIds) public {
        require(isManager[msg.sender]);
        require(now > endTime && now <= endTime.add(confirmationPeriod));

        uint256 investmentId;

        for (uint256 c; c < investmentIds.length; c = c.add(1)) {
            investmentId = investmentIds[c]; // gas optimization
            investments[investmentId].confirmed = true;
            ChangedInvestmentConfirmation(investmentId, investments[investmentId].investor, true);
        }
    }

    function unConfirmPayment(uint256 investmentId) public {
        require(isManager[msg.sender]);
        require(now > endTime && now <= endTime.add(confirmationPeriod));

        investments[investmentId].confirmed = false;
        ChangedInvestmentConfirmation(investmentId, investments[investmentId].investor, false);
    }

    function mintTokenPreSale(address beneficiary, uint256 tokens) public onlyOwner {
        // during pre-sale we can issue tokens for fiat or other contributions
        // pre-sale ends with start of public sales round (accepting Ether)
        require(now < startTime);
        require(alreadyMinted.add(tokens) <= cap);

        alreadyMinted = alreadyMinted.add(tokens);

        token.mint(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, 0, tokens);
    }

    function finaliseContributionPeriod() public onlyOwner {
        confirmationPeriodOver = true;
    }

    function settleInvestment(uint256 investmentId) public {

    }
}
