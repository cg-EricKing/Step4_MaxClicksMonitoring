// CPM Monitoring for Max-Clicks Campaigns

// MCC Level Script that runs off Account Labels

// Monitor Avg. Cpm @ the Account Level => send notification of the status of CPM per Account
// Levels for conditionals
  // Target CPM - $1.25
  // Median CPM - $2.00-$2.99
  // Problem Group - > $3.00

// Push Accounts to arrays that match the levels criteria
  // Array of objects that contain - Account Name / CPM Last 7 Days / CPM All_Time

// Metrics to grab - Avg. CPM for LAST_7_DAYS & Avg. CPM ALL_TIME

// Email Notification with groups of accounts seperated

// Additional script to apply Account Label - iHeart_MaxClicks to possibly be the label in which 
// this script applies to. (If bidding strat === TARGET_SPEND => Add Account Label else Ignore)

function main() {
  
  // Init Spreadsheet
  var spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1VE8ZE1C02VUZETEkO67GgZxzur6x2L-Xe9pw0BNdwHU/edit?usp=sharing';
  var spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
  var sheet = spreadsheet.getSheets()[0];
  
  // Get Today's Date
  var today = new Date();
  var todayDate = Utilities.formatDate(today, "EDT",'MM-dd-yyyy');
  
  // Init Global Variables
  var targetCpm = 1.25;
  var medianCpm = 2.00;
  var maxCpm = 3.00;
  var statusString = '';

  var goodCampaigns = [];
  var doubleCheckCampaigns = [];
  var problemCampaigns = [];
  
  var emailForNotify = 'eric.king@comporium.com';

  // Get Accounts by Label
  var accountSelector = MccApp.accounts()
    .withCondition("LabelNames CONTAINS 'iHeart_MaxClicks'");

  var accountIterator = accountSelector.get();

  while(accountIterator.hasNext()) {
    var account = accountIterator.next();
    
    // Select the client account.
  	MccApp.select(account);
    var accountName = account.getName();
    //Logger.log("Account Name: " + accountName);
    
    var campaignSelector = AdWordsApp
     .campaigns()
    .withCondition("Status = ENABLED");

    var campaignIterator = campaignSelector.get();
    while (campaignIterator.hasNext()) {
      var campaign = campaignIterator.next();
      var campaignName = campaign.getName();
      //Logger.log("Campaign Name: " + campaignName);
      var lastSevenStats = campaign.getStatsFor("LAST_7_DAYS");
      var allTimeStats = campaign.getStatsFor("ALL_TIME");

      var sevenCpm = lastSevenStats.getAverageCpm();
      //Logger.log("Last 7 Days CPM: " + sevenCpm);
      var allCpm = allTimeStats.getAverageCpm();
      //Logger.log("All Time CPM: " + allCpm);
      var accountObject = {
        name: accountName,
        campaign: campaignName,
        lastSeven: sevenCpm,
        allTime: allCpm,
        status: statusString
      };
      var accountArray = [];
      accountArray.push(accountName, campaignName, sevenCpm, allCpm);
		//Logger.log("Max CPM " + maxCpm);
      //Logger.log("Account Name: " + accountName + " Campaign Name: " + campaignName + " Last 7 Avg. CPM " + sevenCpm + " All Time Avg. CPM " + allCpm);
      
      if(sevenCpm >= maxCpm) {
        //Logger.log("CPM is HIGH for this campaign" + accountName + " " + campaignName);
        // Push Account Object to Problem Array
        accountObject.status = 'RED';
        accountArray.push('RED');
        problemCampaigns.push(accountObject);
      } else if(sevenCpm <= maxCpm && sevenCpm > targetCpm) {
        //Logger.log("CPM is higher then $2.00 and may need attention for" + accountName + " " + campaignName);
        // Push Account Object to Double Check Array
        accountObject.status = 'YELLOW';
        accountArray.push('YELLOW');
        doubleCheckCampaigns.push(accountObject);
      } else if (sevenCpm <= targetCpm) {
        //Logger.log("CPM Okay for this campaign" + accountName + " " + campaignName);
        // Push to Good Campaigns Array
        accountObject.status = 'GREEN';
        accountArray.push('GREEN');
        goodCampaigns.push(accountObject);
      } else {
        //Notify - BIG PROBLEM
       	Logger.log("BIG PROBLEM, CPM Greater than $3 " + accountObject.name + accountObject.lastSeven); 
      }

        sheet.appendRow(accountArray);
      
      var goodTotal = goodCampaigns.length;
      var checkTotal = doubleCheckCampaigns.length;
      var problemTotal = problemCampaigns.length;

    }
    //Logger.log("Problem Campaigns: " + problemCampaigns);
    //Logger.log("Double Check Campaigns: " + doubleCheckCampaigns);
    //Logger.log("Good Campaigns: " + goodCampaigns);
  }
   for(var i = 0;i < goodCampaigns.length; i++) {
      	Logger.log("Good Campaigns - " + " Account: " + goodCampaigns[i].name + " Campaign: " + goodCampaigns[i].campaign + " Last 7 Days CPM " + goodCampaigns[i].lastSeven + " All Time CPM " + goodCampaigns[i].allTime + " Status " + goodCampaigns[i].status);
   };
     for(var i = 0;i < doubleCheckCampaigns.length; i++) {
      	Logger.log("Double Check - " + " Account: " + doubleCheckCampaigns[i].name + " Campaign: " + doubleCheckCampaigns[i].campaign + " Last 7 Days CPM " + doubleCheckCampaigns[i].lastSeven + " All Time CPM " + doubleCheckCampaigns[i].allTime + " Status " + doubleCheckCampaigns[i].status);
   };
     for(var i = 0;i < problemCampaigns.length; i++) {
      	Logger.log("Problem Campaigns - " + " Account: " + problemCampaigns[i].name + " Campaign: " + problemCampaigns[i].campaign + " Last 7 Days CPM " + problemCampaigns[i].lastSeven + " All Time CPM " + problemCampaigns[i].allTime + " Status " + problemCampaigns[i].status);
   };
  

  // Email Template
        // Email function to pass string and send through to email provided
        function notify(string) {
        // Construct email template for notifications
        // Must have to, subject, htmlBody
        var emailTemplate = {
            to: emailForNotify,
            subject: 'Max Clicks Monitoring Script',
            htmlBody: "<h1>Comporium Media Services Automation Scripts</h1>" + "<br>" + "<p>The Max Clicks Script has executed. </p>" +
          	"Date of Script Execution: " + todayDate + "<br>" + 
            "<br>" + "<p>The spreadsheet can be viewed @ the following link: </p>" + spreadsheetUrl + "<br>" + 
          	"<p>These are the totals for this execution- </p>" + "<br>"
            + "<p>Total Problem Campaigns - " + problemTotal + "<p>Total Double Check Campaigns - " + checkTotal +
          	"<br>" + "<p>Total Good Campaigns - " + goodTotal + "<br>" + "Additional Notes: " + string + "<br>" +
          	"<p>If something is incorrect with this notification please contact Eric King. Thanks!</p>"
        }
            MailApp.sendEmail(emailTemplate);
        }
  
  notify("Please check the accuracy of this report.");
  sheet.appendRow(['-----','End of script Execution', '-----', '-----', '-----', todayDate]);
}

