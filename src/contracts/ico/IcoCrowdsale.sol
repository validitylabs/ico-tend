/**
 * @title IcoCrowdsale
 * Simple time and capped based crowdsale.
 *
 * @version 1.0
 * @author Validity Labs AG <info@validitylabs.org>
 */
pragma solidity ^0.4.18;

import "../../../node_modules/zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";
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

    uint256 public confirmationPeriod;

    uint256 public cap;

    uint256 public alreadyMinted;           // already minted tokens (maximally = cap)

    bool public confirmationPeriodOver; // can be set by owner to finish confirmation in under 30 days

    uint256 public weiPerChf;

    uint256 public investmentIdLastAttemptedToSettle;

    struct Payment {
        address investor;
        address beneficiary;
        uint256 amount;
        bool confirmed;
        bool attemptedSettlement;
        bool completedSettlement;
    }

    Payment[] public investments;

     /*
     tokenUnitsPerWei = 10 ** uint256(decimals) * tokenPerChf / weiPerChf

     e.g.: 1ETH = 300 CHF -> 1e18 Wei = 300 CHF -> 1CHF = 3.3 e15 Wei
     --> weiPerChf = 3.3 e15
     --> tokenPerChf = 1

     10 ** 18 * 1 / 3.3e15
     = 303 tokens / wei

     alternative example (200 CHF / ETH):
     10 ** 18 * 1 / 5e15
     = 200;
     */

    /**
     * @dev Deploy capped ico crowdsale contract
     * @param _startTime uint256 Start time of the crowdsale
     * @param _endTime uint256 End time of the crowdsale
     * @param _rateTokenPerChf uint256 issueing rate tokens per CHF
     * @param _rateWeiPerChf uint256 exchange rate Wei per CHF
     * @param _wallet address Wallet address of the crowdsale
     * @param _cap uint256 Crowdsale cap
     * @param _confirmationPeriodDays uint256 Confirmation period in days
     */
    function IcoCrowdsale(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rateTokenPerChf,
        uint256 _rateWeiPerChf,
        address _wallet,
        uint256 _cap,
        uint256 _confirmationPeriodDays
    )
        public
        Crowdsale(_startTime, _endTime, (10 ** uint256(18)).mul(_rateTokenPerChf).div(_rateWeiPerChf), _wallet)
    {
        setManager(msg.sender, true);
        cap = _cap;
        weiPerChf = _rateWeiPerChf;
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

    // override (not extend! because we only issues tokens after final KYC confirm phase)
    // core functionality by whitelist check and registration of payment
    function buyTokens(address beneficiary) public payable {
        require(beneficiary != 0x0);
        require(validPurchase());
        require(isWhitelisted[msg.sender]);

        uint256 weiAmount = msg.value;

        weiRaised = weiRaised.add(weiAmount);

        TokenPurchase(msg.sender, beneficiary, weiAmount, 0);

        // register payment so that later on it can be confirmed (and tokens issued and Ether paid out)
        Payment memory newPayment = Payment(msg.sender, beneficiary, weiAmount, false, false, false);
        investments.push(newPayment);
    }

    // extend base functionality with min investment amount
    function validPurchase() internal constant returns (bool) {
        // minimal investment: 500 CHF
        require (msg.value.div(weiPerChf) >= 500);

        return super.validPurchase();
    }

    function confirmPayment(uint256 investmentId) public {
        require(isManager[msg.sender]);
        require(now > endTime && now <= endTime.add(confirmationPeriod));
        require(!confirmationPeriodOver && now <= endTime.add(confirmationPeriod));

        investments[investmentId].confirmed = true;
        ChangedInvestmentConfirmation(investmentId, investments[investmentId].investor, true);
    }

    function batchConfirmPayments(uint256[] investmentIds) public {
        require(isManager[msg.sender]);
        require(now > endTime && now <= endTime.add(confirmationPeriod));
        require(!confirmationPeriodOver && now <= endTime.add(confirmationPeriod));

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
        require(!confirmationPeriodOver && now <= endTime.add(confirmationPeriod));

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

    function finaliseConfirmationPeriod() public onlyOwner {
        confirmationPeriodOver = true;
    }

    function settleInvestment(uint256 investmentId) public {
        // only possible after confirmationPeriodOver has been manually set OR after time is over
        require(confirmationPeriodOver || now > endTime.add(confirmationPeriod));

        Payment storage p = investments[investmentId];

        // investment should not be settled already (prevent double token issueing or repayment)
        require(!p.completedSettlement);

        // investments have to be processed in right order
        // unless we're at first investment, the previous has needs to have undergone an attempted settlement
        require(investmentId == 0 || investments[investmentId.sub(1)].attemptedSettlement);

        p.attemptedSettlement = true;

        // just so that we can see which one we attempted last time and can continue with next
        investmentIdLastAttemptedToSettle = investmentId;

        if (p.confirmed) {
            // if confirmed -> issue tokens, send ETH to wallet and complete settlement

            // calculate number of tokens to be issued to investor
            uint256 tokens = p.amount.mul(rate);

            require(alreadyMinted.add(tokens) <= cap);
            alreadyMinted = alreadyMinted.add(tokens);

            // mint tokens for beneficiary
            token.mint(p.beneficiary, tokens);

            // send Ether to project wallet
            // throws if wallet throws
            wallet.transfer(p.amount);

            p.completedSettlement = true;
        } else {
            // if not confirmed -> reimburse ETH

            // only complete settlement if investor got their money back
            // (does not throw (as .transfer would)
            // otherwise we would block settlement process of all following investments)
            if (p.investor.send(p.amount)) {
                p.completedSettlement = true;
            }
        }
    }

    function batchSettleInvestments(uint256[] investmentIds) public {
        for (uint256 c; c < investmentIds.length; c = c.add(1)) {
            settleInvestment(investmentIds[c]);
        }
    }

    function unpauseToken() public {
        // only possible after confirmationPeriodOver has been manually set OR after time is over
        require(confirmationPeriodOver || now > endTime.add(confirmationPeriod));
        
        Pausable(token).unpause();
    }
}
