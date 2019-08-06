const express = require('express');
const bodyParser = require('body-parser')
const cheerio = require('cheerio');
const pdf = require('html-pdf');
const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static('public'))

// console.log that your server is up and running
app.listen(port, () => console.log(`Listening on port ${port}`));

app.get('/test', (req, res) => {
  res.json({ working: true })
})

// create a POST route
app.post('/generate', (req, res) => {
  const html = req.body.html;

  //will select all table cells from HTML
  const selector = 'table > tbody > .dataTR > td';

  //parses HTML and stores reference to the table with the tds within statsTable
  const page = cheerio.load(html);
  const statsTable = page(selector);

  //get company name from page, removing junk from element at the same time
  const h1 = page('h1').text();
  const companyName = h1.split('').splice(28, h1.length).join('')

  //we will use this function later to format the content of the cells we get from the HTML (eg. removing )
  const formatData = cellText => {
    let cellTextAsArray = cellText.split('');
    if (!isNaN(cellText[0])) {
      //VALUE CELL
      cellTextAsArray.forEach((char, i) => {
        if(char === ' '){
          cellTextAsArray.splice(i, cellTextAsArray.length - i)
        }
      })
      return cellTextAsArray.join('');
    } else {
      //MONTH CELL
      cellTextAsArray.forEach((char, i) => {
        if(char === '/'){
          cellTextAsArray.splice(i,2)
        }
      })
      return cellTextAsArray.join('');
    }
  }


  
  //filter through the cells, pulling only month cells, view cells, and conversion cells
  const filteredData = [];
  let groupCounter = 0;
  statsTable.each(function(i, e){   
    if (groupCounter === 0 || groupCounter === 2 || groupCounter === 3) {
      filteredData.push(formatData(page(e).text()))
    }
    if (groupCounter < 6) {groupCounter++} else {groupCounter = 0}
  });
  
  //trim data to last 12 months, so the last 36 elements of the array.
  const trimmedData = [];
  for (i = filteredData.length - 36; i < filteredData.length; i++) {
    trimmedData.push(filteredData[i])
  }
  
  const newHTML = `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700,800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Open Sans';
          }
          .wrapper {
            width: 800px;
            padding: 20px;
          }
          h1 {
            color: #222;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 0;
            font-size: 28px;
          }
          h2 {
            margin-top: 0;
            margin-bottom: 40px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            font-size: 14px;
          }
          h4 {
            font-weight: 400;
            margin-top: 0;
            margin-bottom: 10px;
          }
          h4 span {
            font-weight: 700;
          }
          table {
            border-collapse: collapse;
            font-size: 12px;
          }
          
          table, th, td {
            border: 1px solid #ddd;
          }
          td, th {
            padding: 5px;
          }
          .month {
            text-align: left;
            width: 300px;
          }
          th {
            text-align: left;
            color: white;
            background-color: grey;
          }
          .total {
            color: #ec008c;
            font-weight: 700;
          }
          .views, .conversions {
            width: 100px;
            text-align: right;
          }
          img {
            width: 80px;
          }
        </style>
      </head>
      <body>
        <div class='wrapper'>
        <h4><span>YACHTING</span>PAGES.COM Traffic Report</h4>
        <h1>${companyName}</h1>
        <h2>Web Showcase</h2>
        <table>
          <tr>
            <th>Month/Year</th>
            <th class='views'>Views</th>
            <th class='conversions'>Conversions</th>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[0]}
            </td>
            <td class='views'>
              ${trimmedData[1]}
            </td>
            <td class='conversions'>
              ${trimmedData[2]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[3]}
            </td>
            <td class='views'>
              ${trimmedData[4]}
            </td>
            <td class='conversions'>
              ${trimmedData[5]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[6]}
            </td>
            <td class='views'>
              ${trimmedData[7]}
            </td>
            <td class='conversions'>
              ${trimmedData[8]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[9]}
            </td>
            <td class='views'>
              ${trimmedData[10]}
            </td>
            <td class='conversions'>
              ${trimmedData[11]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[12]}
            </td>
            <td class='views'>
              ${trimmedData[13]}
            </td>
            <td class='conversions'>
              ${trimmedData[14]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[15]}
            </td>
            <td class='views'>
              ${trimmedData[16]}
            </td>
            <td class='conversions'>
              ${trimmedData[17]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[18]}
            </td>
            <td class='views'>
              ${trimmedData[19]}
            </td>
            <td class='conversions'>
              ${trimmedData[20]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[21]}
            </td>
            <td class='views'>
              ${trimmedData[22]}
            </td>
            <td class='conversions'>
              ${trimmedData[23]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[24]}
            </td>
            <td class='views'>
              ${trimmedData[25]}
            </td>
            <td class='conversions'>
              ${trimmedData[26]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[27]}
            </td>
            <td class='views'>
              ${trimmedData[28]}
            </td>
            <td class='conversions'>
              ${trimmedData[29]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[30]}
            </td>
            <td class='views'>
              ${trimmedData[31]}
            </td>
            <td class='conversions'>
              ${trimmedData[32]}
            </td>
          </tr>
          <tr>
            <td class='month'>
              ${trimmedData[33]}
            </td>
            <td class='views'>
              ${trimmedData[34]}
            </td>
            <td class='conversions'>
              ${trimmedData[35]}
            </td>
          </tr>
          <tr>
            <td class='month total'>Total</td>
            <td class='views total'>${Number(trimmedData[34]) + Number(trimmedData[31]) + Number(trimmedData[28]) + Number(trimmedData[25]) + Number(trimmedData[22]) + Number(trimmedData[19]) + Number(trimmedData[16]) + Number(trimmedData[13]) + Number(trimmedData[10]) + Number(trimmedData[7]) + Number(trimmedData[4]) + Number(trimmedData[1])}</td>
            <td class='conversions total'>${Number(trimmedData[35]) + Number(trimmedData[32]) + Number(trimmedData[29]) + Number(trimmedData[26]) + Number(trimmedData[23]) + Number(trimmedData[20]) + Number(trimmedData[17]) + Number(trimmedData[14]) + Number(trimmedData[11]) + Number(trimmedData[8]) + Number(trimmedData[5]) + Number(trimmedData[2])}</td>
          </tr>
        </table>
        </div>
      </body>
    </html>
  `

  pdf.create(newHTML, { format: 'Letter' }).toFile('public/stats.pdf', function(err, res) {
    if (err) return console.log(err);
    console.log(res); // { filename: '/app/businesscard.pdf' }
  });
  //next, we need to upload the new file to Amazon S3 and display a link to view it.

  res.header("Access-Control-Allow-Origin", "*");
  res.send({ link: 'https://yp-stats-express-netyorazox.now.sh/stats.pdf' });
});