const express = require("express");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const cheerio = require("cheerio");
const pdf = require("html-pdf");
const app = express();
const port = process.env.PORT || 5000;

require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AMAZON_ACCESS_KEY,
  secretAccessKey: process.env.AMAZON_SECRET_KEY
});

const s3 = new AWS.S3();

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static("public"));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// console.log that your server is up and running
app.listen(port, () => console.log(`Listening on port ${port}`));

// create a POST route for generation
app.post("/generate", (req, res) => {
  const { html, logoUrl, level, months } = req.body;
  console.log(req.body)

  // bla bla bla

  //will select all table cells from HTML
  const selector = "table > tbody > .dataTR > td";

  //parses HTML and stores reference to the table with the tds within statsTable
  const page = cheerio.load(html);
  const statsTable = page(selector);

  const numberOfColumns = 13;

  console.log(statsTable)

  //get company name from page, removing junk from element at the same time
  const h1 = page("h1 i").text();
  const companyName = h1
    // .split("")
    // .splice(h1[0] === "P" ? 22 : 28, h1.length)
    // .join("");

  //we will use this function later to format the content of the cells we get from the HTML
  const formatData = (cellText) => {
    let cellTextAsArray = cellText.split("");
    if (!isNaN(cellText[0])) {
      //VALUE CELL
      cellTextAsArray.forEach((char, i) => {
        if (char === " ") {
          cellTextAsArray.splice(i, cellTextAsArray.length - i);
        }
      });
      return cellTextAsArray.join("");
    } else {
      //MONTH CELL
      cellTextAsArray.forEach((char, i) => {
        if (char === "/") {
          cellTextAsArray.splice(i, 2);
        }
      });
      return cellTextAsArray.join("");
    }
  };

  //filter through the cells, pulling only month cells, view cells, and conversion cells
  const filteredData = [];
  let groupCounter = 0;
  statsTable.each(function (i, e) {
    if (groupCounter === 0 || groupCounter === 2 || groupCounter === 3) {
      filteredData.push(formatData(page(e).text()));
    }
    // add email conversions amount to previous conversions cell pushed to array
    if (groupCounter === 4) {
      const emailConvs = Number(formatData(page(e).text()));
      const websiteConvs = Number(filteredData.pop());
      const totalConvs = emailConvs + websiteConvs;
      filteredData.push(totalConvs);
    }
    if (groupCounter < numberOfColumns) {
      groupCounter++;
    } else {
      groupCounter = 0;
    }
  });

  console.log('Filtered data:')
  console.log(filteredData)

  //trim data to last 12 months, so the last 36 elements of the array.
  const trimmedData = [];
  for (let i = filteredData.length - months * 3; i < filteredData.length; i++) {
    trimmedData.push(filteredData[i]);
  }

  //function to return product name based on level, called in PDF HTML below
  const getProductName = (level) => {
    switch (level) {
      case 1:
        return "Showcase";
        break;
      case 2:
        return "Mini Showcase";
        break;
      case 3:
        return "Featured Listing";
        break;
    }
  };

  // really lazy maths
  // const totalViews = Number(trimmedData[34]) + Number(trimmedData[31]) + Number(trimmedData[28]) + Number(trimmedData[25]) + Number(trimmedData[22]) + Number(trimmedData[19]) + Number(trimmedData[16]) + Number(trimmedData[13]) + Number(trimmedData[10]) + Number(trimmedData[7]) + Number(trimmedData[4]) + Number(trimmedData[1])
  // const totalConversions = Number(trimmedData[35]) + Number(trimmedData[32]) + Number(trimmedData[29]) + Number(trimmedData[26]) + Number(trimmedData[23]) + Number(trimmedData[20]) + Number(trimmedData[17]) + Number(trimmedData[14]) + Number(trimmedData[11]) + Number(trimmedData[8]) + Number(trimmedData[5]) + Number(trimmedData[2])
  // const conversionRate = (totalConversions / totalViews * 100).toFixed(2) + "%"

  let totalViews = 0;
  let totalConversions = 0;
  let gi = 0;

  trimmedData.forEach((el) => {
    if (gi === 1) {
      totalViews += Number(el);
    }
    if (gi === 2) {
      totalConversions += Number(el);
    }
    if (gi < 2) {
      gi++;
    } else {
      gi = 0;
    }
  });

  const conversionRate =
    ((totalConversions / totalViews) * 100).toFixed(2) + "%";

  const htmlStart = `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700,800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Open Sans';
          }
          .wrapper {
            width: 538px;
            padding: 20px;
          }
          h1 {
            color: #222;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 2px;
            font-size: 22px;
          }
          h2 {
            margin-top: 0;
            margin-bottom: 40px;
            font-weight: 700;
            color: #888;
            text-transform: uppercase;
            font-size: 12px;
          }
          h2 span {
            font-weight: 400;
            padding-left: 10px;
          }
          h4 {
            font-weight: 400;
            font-size: 10px;
            margin-top: 0;
            margin-bottom: 10px;
          }
          .fat {
            font-weight: 800;
          }
          .pink {
            color: #ec008c;
            font-size: 12px;
            font-weight: 400;
            text-transform: uppercase;
          }
          table {
            font-size: 12px;
            border-collapse: collapse;
            border: 1px solid #eee;
          }
        
          td, th {
            padding: 5px 10px;
          }
          .month {
            text-align: left;
            width: 200px;
          }
          th {
            text-align: left;
            background-color: #ec008c;
            text-transform: uppercase;
            color: white;
            border: none;
          }
          tr {
            border: 1px solid #eee;
          }
          .total {
            font-weight: 700;
            text-transform: uppercase;
            color: #ec008c;
          }
          .views, .conversions {
            width: 100px;
            text-align: right;
          }
          .r1, .r3, .r5, .r7, .r9, .r11, .r13 {
            background-color: #fbfbfb;
          }
          .r2, .r4, .r6, .r8, .r10, .r12, .r14 {
            background-color: #f5f5f5;
          }
          .header {
            margin-bottom: 140px;
          }
          .header .text {
            width: 380px;
            float: left;
          }
          .header .logo {
            float: right;
          }
          .header img {
            width: 150px;
          }
          .clear {
            clear: both;
          }
          footer {
            position: absolute;
            bottom: 0;
            margin-bottom: 20px;
          }
          footer img {
            width: 100px;
          }
          footer p {
            position: absolute;
            bottom: -8px;
            font-size: 10px;
            left: 120px;
            width: 600px;
          }
        </style>
      </head>
      <body>
        <div class='wrapper'>
        <div class='header'>
          <div class='text'>
            <h4><span class='fat'>YACHTING</span>PAGES.COM <br /><span class='pink'>Traffic Report</span></h4>
            <h1>${companyName}</h1>
            <h2>${getProductName(level)} <span>${
    trimmedData[trimmedData.length - 3]
  } - ${trimmedData[0]}<span></h2>
            <h4></h4>
          </div>
          <div class='logo'>
            <img src="${logoUrl}"/>
          </div>
        </div>
        <div class='clear'></div>
        <table>
          <tr class='hr'>
            <th>Date</th>
            <th class='views'>Views</th>
            <th class='conversions'>Conversions</th>
          </tr>
  `;

  console.log("Trimmed data:")
  console.log(trimmedData)

  let dataRows = []
  for (let i = 0; i < trimmedData.length / 3; i++) {
    const row = (`
    <tr class='row'>
      <td class='month'>
        ${trimmedData[i * 3]}
      </td>
      <td class='views'>
        ${trimmedData[i * 3 + 1]}
       </td>
       <td class='conversions'>
         ${trimmedData[i * 3 + 2]}
       </td>
    </tr>
  `)
    if (i < 1) {
      dataRows.push(row)
    } else {
      dataRows.unshift(row)
    }
  }

  // <tr class='r1'>
  //   <td class='month'>
  //     ${trimmedData[0]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[1]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[2]}
  //   </td>
  // </tr>
  // <tr class='r2'>
  //   <td class='month'>
  //     ${trimmedData[3]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[4]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[5]}
  //   </td>
  // </tr>
  // <tr class='r3'>
  //   <td class='month'>
  //     ${trimmedData[6]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[7]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[8]}
  //   </td>
  // </tr>
  // <tr class='r4'>
  //   <td class='month'>
  //     ${trimmedData[9]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[10]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[11]}
  //   </td>
  // </tr>
  // <tr class='r5'>
  //   <td class='month'>
  //     ${trimmedData[12]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[13]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[14]}
  //   </td>
  // </tr>
  // <tr class='r6'>
  //   <td class='month'>
  //     ${trimmedData[15]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[16]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[17]}
  //   </td>
  // </tr>
  // <tr class='r7'>
  //   <td class='month'>
  //     ${trimmedData[18]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[19]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[20]}
  //   </td>
  // </tr>
  // <tr class='r8'>
  //   <td class='month'>
  //     ${trimmedData[21]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[22]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[23]}
  //   </td>
  // </tr>
  // <tr class='r9'>
  //   <td class='month'>
  //     ${trimmedData[24]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[25]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[26]}
  //   </td>
  // </tr>
  // <tr class='r10'>
  //   <td class='month'>
  //     ${trimmedData[27]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[28]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[29]}
  //   </td>
  // </tr>
  // <tr class='r11'>
  //   <td class='month'>
  //     ${trimmedData[30]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[31]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[32]}
  //   </td>
  // </tr>
  // <tr class='r12'>
  //   <td class='month'>
  //     ${trimmedData[33]}
  //   </td>
  //   <td class='views'>
  //     ${trimmedData[34]}
  //   </td>
  //   <td class='conversions'>
  //     ${trimmedData[35]}
  //   </td>
  // </tr>

  const htmlEnd = `<tr class='r13'>
            <td class='month total'>Total</td>
            <td class='views total'>${totalViews}</td>
            <td class='conversions total'>${totalConversions}</td>
          </tr>
          <tr class='r14'>
            <td class='month total'>Conversion rate</td>
            <td colspan='2' class='views total'>${conversionRate}</td>       
          </tr>
        </table>
        <footer>
          <img src='https://www.yachting-pages.com/theme/companies/yp/images/yachting-pages-superyacht-directory.gif' />
          <p><b>YACHTINGPAGES.COM</b><br />info@yachtingpages.com<br />470 Bath Road, Bristol, BS4 3AP, UK</p>
        </footer>
        </div>
        
      </body>
    </html>
  `;

  const newHTML = htmlStart + dataRows.toString().split(',').join("") + htmlEnd;

  // const filename = Date.now();
  const filename = companyName.split(' ').join('_') + '_' + Date.now()
  pdf.create(newHTML, { format: "A4" }).toBuffer(function (err, buffer) {
    if (err) {
      return console.log(err);
    }
    //upload to s3

    const params = {
      Bucket: "yp-stats-generated-reports",
      Key: filename + ".pdf",
      Body: buffer,
    };
    s3.putObject(params, (err, data) => {
      if (err) {
        console.log("There was an error while saving the PDF to S3");
        console.log(err);
        var error = new Error("There was an error while saving the PDF to S3");
        callback(error);
      } else {
        console.log("PDF generated");
        res.send({
          link:
            "https://yp-stats-generated-reports.s3-eu-west-1.amazonaws.com/" +
            filename +
            ".pdf",
          companyName: companyName
        });
      }
    });
  });
});
