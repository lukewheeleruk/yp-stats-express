const express = require('express');
const bodyParser = require('body-parser')
const cheerio = require('cheerio');
const pdf = require('html-pdf');
const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// console.log that your server is up and running
app.listen(port, () => console.log(`Listening on port ${port}`));

// create a POST route
app.post('/generate', (req, res) => {
  const html = req.body.html;

  //will select all table cells from HTML
  const selector = 'table > tbody > .dataTR > td';

  //parses HTML and stores reference to the table with the tds within statsTable
  const page = cheerio.load(html);
  const statsTable = page(selector);

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
        <style>
          h1 {
            color: red;
          }
        </style>
      </head>
      <body>
        <h1>Stats</h1>
        <h2>${trimmedData[0]}</h2>
        <h2>${trimmedData[1]}</h2>
        <h2>${trimmedData[2]}</h2>
      </body>
    </html>
  `

  pdf.create(newHTML, { format: 'Letter' }).toFile('./stats.pdf', function(err, res) {
    if (err) return console.log(err);
    console.log(res); // { filename: '/app/businesscard.pdf' }
  });

  //next, we need to upload the new file to Amazon S3 and display a link to view it.

  res.send({ link: trimmedData });
});