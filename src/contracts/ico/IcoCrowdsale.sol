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
import "../../../node_modules/zeppelin-solidity/contracts/token/ERC20/TokenVesting.sol";
import "./IcoToken.sol";

contract IcoCrowdsale is Crowdsale, Ownable {
    /*** CONSTANTS ***/
    // Different levels of caps per allotment
    uint256 public constant MAX_TOKEN_CAP = 13e6 * 1e18;        // 13 million * 1e18

    // // Bottom three should add to above
    uint256 public constant ICO_ENABLERS_CAP = 15e5 * 1e18;     // 1.5 million * 1e18
    uint256 public constant DEVELOPMENT_TEAM_CAP = 2e6 * 1e18;  // 2 million * 1e18
    uint256 public constant ICO_TOKEN_CAP = 95e5 * 1e18;        // 9.5 million  * 1e18

    uint256 public constant CHF_CENT_PER_TOKEN = 1000;          // standard CHF per token rate - in cents - 10 CHF => 1000 CHF cents
    uint256 public constant MIN_CONTRIBUTION_CHF = 500;

    uint256 public constant VESTING_CLIFF = 1 years;
    uint256 public constant VESTING_DURATION = 3 years;
   
    // Amount of discounted tokens per discount stage (2 stages total; each being the same amount)
    uint256 public constant DISCOUNT_TOKEN_AMOUNT = 3e6 * 1e18; // 3 million * 1e18

    uint256 public minContributionInWei;
    uint256 public tokenPerWei;
    address public underwriter;

    // allow managers to blacklist and confirm contributions by manager accounts
    // (managers can be set and altered by owner, multiple manager accounts are possible
    mapping(address => bool) public isManager;

    // true if addess is not allowed to invest
    mapping(address => bool) public isBlacklisted;

    uint256 public confirmationPeriod;
    bool public confirmationPeriodOver;     // can be set by owner to finish confirmation in under 30 days

    // Track tokens depending which stage that the ICO is in
    uint256 public tokensToMint;            // tokens to be minted after confirmation
    uint256 public tokensMinted;            // already minted tokens (maximally = cap)
    uint256 public icoEnablersTokensMinted;
    uint256 public developmentTeamTokensMinted;

    // for convenience we store vesting wallets
    address[] public vestingWallets;

    uint256 public investmentIdLastAttemptedToSettle;

    struct Payment {
        address investor;
        address beneficiary;
        uint256 weiAmount;
        uint256 tokenAmount;
        bool confirmed;
        bool attemptedSettlement;
        bool completedSettlement;
    }

    Payment[] public investments;

    /*** EVENTS ***/
    event ChangedInvestorBlacklisting(address investor, bool blacklisted);
    event ChangedManager(address manager, bool active);
    event ChangedInvestmentConfirmation(uint256 investmentId, address investor, bool confirmed);

    /*** MODIFIERS ***/
    modifier onlyUnderwriter() {
        require(msg.sender == underwriter);
        _;
    }

    modifier onlyManager() {
        require(isManager[msg.sender]);
        _;
    }

    modifier onlyNoneZero(address _to, uint256 _amount) {
        require(_to != address(0));
        require(_amount > 0);
        _;
    }

    modifier onlyConfirmPayment() {
        require(now > endTime && now <= endTime.add(confirmationPeriod));
        require(!confirmationPeriodOver);
        _;
    }

    modifier onlyConfirmationOver() {
        require(confirmationPeriodOver || now > endTime.add(confirmationPeriod));
        _;
    }

    /**
     * @dev Deploy capped ico crowdsale contract
     * @param _startTime uint256 Start time of the crowdsale
     * @param _endTime uint256 End time of the crowdsale
     * @param _rateChfPerEth uint256 CHF per ETH rate
     * @param _wallet address Wallet address of the crowdsale
     * @param _confirmationPeriodDays uint256 Confirmation period in days
     * @param _underwriter address of the underwriter
     */
    function IcoCrowdsale(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rateChfPerEth,
        address _wallet,
        uint256 _confirmationPeriodDays,
        address _underwriter
    )
        public
        Crowdsale(_startTime, _endTime, _rateChfPerEth, _wallet)
    {
        require(MAX_TOKEN_CAP == ICO_ENABLERS_CAP.add(ICO_TOKEN_CAP).add(DEVELOPMENT_TEAM_CAP));
        require(_underwriter != address(0));

        setManager(msg.sender, true);

        tokenPerWei = (_rateChfPerEth.mul(1e2)).div(CHF_CENT_PER_TOKEN);
        minContributionInWei = (MIN_CONTRIBUTION_CHF.mul(1e18)).div(_rateChfPerEth);

        confirmationPeriod = _confirmationPeriodDays * 1 days;
        underwriter = _underwriter;
    }

    /**
     * @dev Set / alter manager / blacklister account. This can be done from owner only
     * @param _manager address address of the manager to create/alter
     * @param _active bool flag that shows if the manager account is active
     */
    function setManager(address _manager, bool _active) public onlyOwner {
        isManager[_manager] = _active;
        ChangedManager(_manager, _active);
    }

    /**
     * @dev blacklist investor from participating in the crowdsale
     * @param _investor address address of the investor to disallowed participation
     */
    function blackListInvestor(address _investor) public onlyManager {
        isBlacklisted[_investor] = true;
        ChangedInvestorBlacklisting(_investor, true);
    }

    /**
     * @dev unblacklist investor from participating in the crowdsale
     * @param _investor address address of the investor to disallowed participation
     */
    function unBlackListInvestor(address _investor) public onlyManager {
        isBlacklisted[_investor] = false;
        ChangedInvestorBlacklisting(_investor, false);
    }

    /**
     * @dev override (not extend! because we only issues tokens after final KYC confirm phase)
     *      core functionality by blacklist check and registration of payment
     * @param _beneficiary address address of the beneficiary to receive tokens after they have been confirmed
     */
    function buyTokens(address _beneficiary) public payable {
        require(_beneficiary != address(0));
        require(validPurchase());
        require(!isBlacklisted[msg.sender]);

        uint256 weiAmount = msg.value;

        // regular rate - no discount
        uint256 tokenAmount = weiAmount.mul(tokenPerWei);

        // @TODO: FIXME: need to gracefully handle overflow of discounts into the other tiers
        // Need a better way if we want a strict stop at 3 million tokens. Which could mean 1 investors gets partial bonus(es) E.g. (20% and 10%) or (10% and 0%)
        // 20% discount - 1st 3 million tokens
        if (tokensToMint <= DISCOUNT_TOKEN_AMOUNT) {
            tokenAmount = tokenAmount.mul(10).div(8);
        // 10% discount - 2nd 3 million tokens
        } else if (tokensToMint > DISCOUNT_TOKEN_AMOUNT && tokensToMint <= DISCOUNT_TOKEN_AMOUNT.mul(2)) {
            tokenAmount = tokenAmount.mul(10).div(9);
        }

        tokensToMint = tokensToMint.add(tokenAmount);
        weiRaised = weiRaised.add(weiAmount);

        TokenPurchase(msg.sender, _beneficiary, weiAmount, tokenAmount);

        // register payment so that later on it can be confirmed (and tokens issued and Ether paid out)
        Payment memory newPayment = Payment(msg.sender, _beneficiary, weiAmount, tokenAmount, false, false, false);
        investments.push(newPayment);
    }

    /**
     * @dev confirms payment
     * @param _investmentId uint256 uint256 of the investment id to confirm
     */
    function confirmPayment(uint256 _investmentId) public onlyManager onlyConfirmPayment {
        investments[_investmentId].confirmed = true;
        ChangedInvestmentConfirmation(_investmentId, investments[_investmentId].investor, true);
    }

    /**
     * @dev confirms payments via a batch method
     * @param _investmentIds uint256[] array of uint256 of the investment ids to confirm
     */
    function batchConfirmPayments(uint256[] _investmentIds) public onlyManager onlyConfirmPayment {
        uint256 investmentId;

        for (uint256 c; c < _investmentIds.length; c = c.add(1)) {
            investmentId = _investmentIds[c]; // gas optimization
            investments[investmentId].confirmed = true;
            ChangedInvestmentConfirmation(investmentId, investments[investmentId].investor, true);
        }
    }

    /**
     * @dev unconfirms payment made via investment id
     * @param _investmentId uint256 uint256 of the investment to unconfirm
     */
    function unConfirmPayment(uint256 _investmentId) public onlyManager onlyConfirmPayment {
        investments[_investmentId].confirmed = false;
        ChangedInvestmentConfirmation(_investmentId, investments[_investmentId].investor, false);
    }

    /**
     * @dev allows contract owner to mint team tokens per ICO_ENABLERS_CAP and transfer to the team wallet
     * @param _beneficiary address address of the beneficiary to receive tokens
     * @param _tokens uint256 uint256 of the token amount to mint
     */
    function mintTokenPreSale(address _beneficiary, uint256 _tokens) public onlyOwner {
        // during pre-sale we can issue tokens for fiat or other contributions
        // pre-sale ends with start of public sales round (accepting Ether)
        require(now < startTime);
        require(tokensToMint.add(_tokens) <= ICO_TOKEN_CAP);

        tokensToMint = tokensToMint.add(_tokens);

        // register payment so that later on it can be confirmed (and tokens issued and Ether paid out)
        Payment memory newPayment = Payment(address(0), _beneficiary, 0, _tokens, false, false, false);
        investments.push(newPayment);
        TokenPurchase(msg.sender, _beneficiary, 0, _tokens);
    }

    /**
     * @dev allows contract owner to mint tokens for ICO enablers (no vesting)
     * @param _to address for beneficiary
     * @param _tokens uint256 token amount to mint
     */
    function mintIcoEnablersTokens(address _to, uint256 _tokens) public onlyOwner onlyNoneZero(_to, _tokens) {
        require(icoEnablersTokensMinted.add(_tokens) <= ICO_ENABLERS_CAP);

        token.mint(_to, _tokens);
        icoEnablersTokensMinted = icoEnablersTokensMinted.add(_tokens);
    }

    /**
     * @dev allows contract owner to mint team tokens per ICO_ENABLERS_CAP and transfer to the team wallet
     * @param _to address for beneficiary
     * @param _tokens uint256 token amount to mint
     */
    function mintDevelopmentTeamTokens(address _to, uint256 _tokens) public onlyOwner onlyNoneZero(_to, _tokens) {
        require(developmentTeamTokensMinted.add(_tokens) <= DEVELOPMENT_TEAM_CAP);

        developmentTeamTokensMinted = developmentTeamTokensMinted.add(_tokens);
        TokenVesting newVault = new TokenVesting(_to, now, VESTING_CLIFF, VESTING_DURATION, false);
        vestingWallets.push(address(newVault)); // for convenience we keep them in storage so that they are easily accessible via MEW or etherscan
        token.mint(address(newVault), _tokens);
    }

    /**
     * @dev returns number of elements in the vestinWallets array
     */
    function getVestingWalletLength() public view returns (uint256) {
        return vestingWallets.length;
    }

    /**
     * @dev set final the confirmation period
     */
    function finalizeConfirmationPeriod() public onlyOwner {
        confirmationPeriodOver = true;
    }

    /**
     * @dev settlement of investment made via investment id
     * @param _investmentId uint256 uint256 being the investment id
     */
    function settleInvestment(uint256 _investmentId) public onlyConfirmationOver {
        Payment storage p = investments[_investmentId];

        // investment should not be settled already (prevent double token issueing or repayment)
        require(!p.completedSettlement);

        // investments have to be processed in right order
        // unless we're at first investment, the previous has needs to have undergone an attempted settlement

        require(_investmentId == 0 || investments[_investmentId.sub(1)].attemptedSettlement);

        p.attemptedSettlement = true;

        // just so that we can see which one we attempted last time and can continue with next
        investmentIdLastAttemptedToSettle = _investmentId;

        if (p.confirmed) {
            // if confirmed -> issue tokens, send ETH to wallet and complete settlement

            // calculate number of tokens to be issued to investor
            uint256 tokens = p.tokenAmount;

            //Checks and balances to make sure tokensMinted == tokensToMint
            require(tokensMinted.add(tokens) <= ICO_TOKEN_CAP);
            require(tokensToMint.sub(tokens) >= 0);
            tokensToMint = tokensToMint.sub(tokens);
            tokensMinted = tokensMinted.add(tokens);

            // mint tokens for beneficiary
            token.mint(p.beneficiary, tokens);

            // send Ether to project wallet throws if wallet throws
            if (p.weiAmount > 0) {
                wallet.transfer(p.weiAmount);
            }

            p.completedSettlement = true;
        } else {
            // if not confirmed -> reimburse ETH or if fiat (presale) investor: do nothing
            // only complete settlement if investor got their money back
            // (does not throw (as .transfer would)
            // otherwise we would block settlement process of all following investments)
            if (p.investor != address(0) && p.weiAmount > 0) {
                if (p.investor.send(p.weiAmount)) {
                p.completedSettlement = true;
                }
            }
        }
    }

    /**
     * @dev allows the batch settlement of investments made
     * @param _investmentIds uint256[] array of uint256 of investment ids
     */
    function batchSettleInvestments(uint256[] _investmentIds) public {
        for (uint256 c; c < _investmentIds.length; c = c.add(1)) {
            settleInvestment(_investmentIds[c]);
        }
    }

    /**
     * @dev allows contract owner to finalize the ICO, unpause tokens, set treasurer, finish minting, and transfer ownship of the token contract
     */
    function finalize() public onlyUnderwriter onlyConfirmationOver {
        Pausable(token).unpause();

        // this crowdsale also should not be treasurer of the token anymore
        IcoToken(token).setTreasurer(this, false);

        // do not allow new owner to mint further tokens
        MintableToken(token).finishMinting();

        // until now the owner of the token is this crowdsale contract
        // in order for a human owner to make use of the tokens onlyOwner functions
        // we need to transfer the ownership
        // in the end the owner of this crowdsale will also be the owner of the token
        Ownable(token).transferOwnership(owner);
    }

    /**
     * @dev Create new instance of ico token contract
     */
    function createTokenContract() internal returns (MintableToken) {
        return new IcoToken();
    }

    /**
     * @dev extend base functionality with min investment amount
     */
    function validPurchase() internal view returns (bool) {
        // minimal investment: 500 CHF (represented in wei)
        require (msg.value >= minContributionInWei);
        return super.validPurchase();
    }
}
