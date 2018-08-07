// If CPM for Last 7 Days is > $2 (On campaigns using Max Clicks) then give alert to change strategy.

// Can this monitor CPM to make sure it doesn't go over $3, and also only adjust budgets after 7 days?

// I'll switch accounts over to max clicks on Monday's so we can set the script frequency to weekly.

// Select Current Account
// Select Active Campaign
// Get Stats For Last 7 Days
// Run on a weekly frequency
    // Get Average CPM
    // Check if Bidding Strategy is Max Clicks
    // IF CPM is > $2 => NOTIFY to change to VCPM
    // IF CPM is > $3 => adjust budget? = > What calculations needed?
        // Would require a spreadsheet - Ordered Impressions
        // Additional Metrics = Current Budget / AllTime Impressions

function main() {
    // Init Variables
    var emailForNotify = "eric.king@comporium.com";

    // Grab Ordered Impressions
    var orderedImpressions = sheet.getRange(2,3);

    // Grab Days Remaining
    var daysRemaining = sheet.getRange(5,2);

    // Email function to pass string and send through to email provided
    function notify(string) {
        // Construct email template for notifications
        // Must have to, subject, htmlBody
        var emailTemplate = {
            to: emailForNotify,
            subject: accountName,
            htmlBody: "<h1>Comporium Media Services Automation Scripts</h1>" + "<br>" + "<p>This account has encountered has been flagged</p>" + accountName +
            "<br>" + "<p>This campaign is a candidate for VCPM: </p>" + campaignName + "<br>" + "<p>Additional Information - </p>" + "<br>"
            + string + "<p>Average CPM For Last 7 Days: " + avgCpm + "<br>" +"<p>If something is incorrect with this notification please reach out to eric.king@comporium.com. Thanks!</p>"
        }
            MailApp.sendEmail(emailTemplate);
    }

    // select current account - get account name and return it
    var currentAccount = AdWordsApp.currentAccount();
    var accountName = currentAccount.getName();
    Logger.log("Account - " + accountName);

    // Select current Campaign - ENABLED
    var campaignSelector = AdWordsApp
        .campaigns()
        .withCondition("Status = ENABLED");

    var campaignIterator = campaignSelector.get();

    while(campaignIterator.hasNext()) {
        var campaign = campaignIterator.next();
        var campaignName = campaign.getName();
        Logger.log(campaignName);

        var currentDailyBudget = campaign.getBudget().getAmount();
        Logger.log("current daily budget: " + currentDailyBudget);
    
        var currentBiddingStrategy = campaign.getBiddingStrategyType();
        Logger.log("current bidding strategy: " + currentBiddingStrategy);
        var campaignBidding = AdWordsApp.campaignBidding();

        var sevenStats = campaign.getStatsFor("LAST_7_DAYS");
        var avgCpm = sevenStats.getAverageCpm();
        Logger.log("Average Cpm Last 7 Days: " + avgCpm);

        var allStats = campaign.getStatsFor("ALL_TIME");
        var currentImpressions = allStats.getImpressions();
        Logger.log("Total Impressions: " + currentImpressions);

        var impressionsRemaining = orderedImpressions - allImpressions;

        var dailyImpressions = impressionsRemaining / daysRemaining;
        Logger.log("Daily Impressions: " + dailyImpressions);

        var dailyBudget = dailyImpressions / 1000 * avgCpm;
        Logger.log("Daily Budget Calculation: " + dailyBudget);


        if(avgCpm > 2) {
            Logger.log("Cpm has gone above $2 on this max clicks campaign - available to switch Bidding Strategy");
            notify("Cpm has gone above $2 on this max clicks campaign - available to switch Bidding Strategy");
        }
        else if(avgCpm > 3) {
            Logger.log("CPM has gone above $3 on this max clicks campaign - adjusting budget to - " + dailyBudget);
            notify("Cpm has gone above $3 on this max clicks campaign - adjusting budget to the calculated daily budget");
            campaignBidding.setStrategy("MANUAL_CPM");
        } else {
            Logger.log("This Max Clicks campaign should continue using this bidding strategy");
        }
    }
}