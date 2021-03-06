// libraries to read csv
var csv              = require('fast-csv'); // require fast-csv module
var fs               = require('fs'); // require the fs, filesystem module

// initial valuables for customers
// errors already handled by fs library
var streamCustomers  = fs.createReadStream("csv/customers.csv");
var customersError   = false;
var customersDone    = false;
var customers        = {};

// initial valuables for policies
// errors already handled by fs library
var streamPolicies   = fs.createReadStream("csv/policies.csv");
var policiesError    = false;
var policiesDone     = false;
var policies         = {};

// start streaming data from customers.csv
csv.fromStream(streamCustomers, {headers : ["id", "firstName", "lastName", "dob"]})
  .validate(function(data){
    // If validation fail, return false. If validation pass, return true
    // Check to see if any column is missing
    if (!!data.id && !!data.firstName && !!data.lastName && !!data.dob) {
      return true;
    } else {
      customersError = true;
      return false;
    }
    // later. check if there is duplicated ids
  })
  .on("data-invalid", function(data){
    console.log("-----Customer Row Has An Error-----");
    console.log(data);
  })
  .on("data", function(data){
    customers[data.id] = {
      fullName: data.firstName + ' ' + data.lastName,
      dob: data.dob
    };
  })
  .on("end", function(){
    // because streaming is asynchronous, we don't know which stream will finish last
    // therefore we have two boolean variable representing each stream
    // and generateReport only when both stream is completed
    // console.log(customers)
    if (customersError) {
      console.log("Please fix errors in customers.csv in order to proceed");
    } else {
      customersDone = true;
      generateReport();
    }
  });

// start streaming data from policies.csv
csv.fromStream(streamPolicies  , {headers : ["policyNumber", "id", "insuranceType"]})
  .validate(function(data){
    // If validation fail, return false. If validation pass, return true
    // Check to see if any column is missing
    if (!!data.policyNumber && !!data.id && !!data.insuranceType) {
      return true;
    } else {
      policiesError = true;
      return false;
    }
    // check if customers have both types or many more insurances
  })
  .on("data-invalid", function(data){
    console.log("-----Policy Row Has An Error-----");
    console.log(data);
  })
  .on("data", function(data){
    // need to update functions to this format to fix policy overwrite problem
    // if (policies[data.id] === undefined) {policies[data.id] = [];}
    // policies[data.id].push({
    //   policyNumber: data.policyNumber,
    //   insuranceType: data.insuranceType
    // })
    policies[data.id] = {
      policyNumber: data.policyNumber,
      insuranceType: data.insuranceType
    };
  })
  .on("end", function(){
    // because streaming is asynchronous, we don't know which stream will finish last
    // therefore we have two boolean variable representing each stream
    // and generateReport only when both stream is completed
    // console.log(policies)
    if (policiesError) {
      console.log("Please fix errors in polices.csv in order to proceed");
    } else {
      policiesDone = true;
      generateReport();
    }
  });

function generateReport () {
  if (customersDone && policiesDone) {
    // an array to store reports
    var reports = [];

    // for each policies, generate a report
    for (var id in policies) {
      var customerID    = id;

      // retrieve customer object and relevent information from customers
      var customerOBJ   = customers[customerID];
      var fullName      = customerOBJ.fullName;

      // retrieve policy object and relevent information from policies
      var policyOBJ     = policies[customerID];
      var policyNumber  = policyOBJ.policyNumber;
      var insuranceType = policyOBJ.insuranceType;

      // Generate an array of report objects to be converted to csv
      reports.push({
        customerID: customerID,
        fullName: fullName,
        policyNumber: policyNumber,
        insuranceType: insuranceType
      });
    }
    // console.log(reports)

    // validate reports for quality control
    // generate csv when all test pass
    if (validateReport(reports)) {
      generateCSV(reports);
    }
  }
}

function validateReport (reports) {
  // test if any field in reports is missing
  // test if policy number contain 5 characters
  // test if policy count matches report count

  // for each test, console.log whether the test pass or fail, the reason, and for which customer
  // return true when all validation checks out otherwise return false
  return true;
}

function generateCSV (reports) {
  // initializing the report csv file
  var timeZoneOffset  = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
  var localTime       = (new Date(Date.now() - timeZoneOffset)).toISOString().slice(0,-5).replace("T", "-"); // splice out milliseconds
  var reportCSV       = fs.createWriteStream("report-" + localTime + ".csv");

  csv
    .write(reports, {headers: true})
    .on("end", function(){
      console.log("Successfully Generated Report!");
    })
    .pipe(reportCSV);
}
