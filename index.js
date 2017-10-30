const express = require('express');
const path = require('path');
const Raven = require('raven');
const gist = require('./gist.js');
const app = express();

Raven.config(process.env.DSN).install();

app.use(Raven.requestHandler());

app.disable('x-powered-by');

app.set('view engine', 'ejs')
app.use('/static', express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './views/index.html'));
});

app.use(express.static('public'));

app.get('/not-a-gist', (req, res) => {
  res.sendFile(path.join(__dirname, './views/not-a-gist.html'));
})

app.get('/_trigger', (req, res) => {
  res.send('ok');
});

app.get('/@:id', (req, res) => {
  res.redirect('https://github.com/' + req.params.id);
});

app.get('/:id', (req, res) => {
  if (!/^([a-z0-9]+)$/.test(req.params.id)) {
    res.status(404);
    return res.sendFile(path.join(__dirname, './views/404.html'));
  }
  
  gist.single(req.params.id).then((body) => {
    res.render('content', body);
  }).catch((err) => {
    console.log(err);
    res.status(404);
    res.sendFile(path.join(__dirname, './views/404.html'));
  });
});

app.get('/:id/:file', (req, res) => {
  if (!/^([a-z0-9]+)$/.test(req.params.id)) {
    res.status(404);
    return res.sendFile(path.join(__dirname, './views/404.html'));
  }
  
  gist.file(req.params.id, req.params.file).then((body) => {
    res.render('content', body);
  }).catch((err) => {
    console.log(err);
    res.status(404);
    res.sendFile(path.join(__dirname, './views/404.html'));
  });
});

app.all('/*', (req, res) => {
  res.status(404);
  res.sendFile(path.join(__dirname, './views/404.html'));
});

app.use(Raven.errorHandler());

app.use(function onError(err, req, res, next) {
    res.statusCode = 500;
    res.sendFile(path.join(__dirname, './views/500.html'));
});

app.listen(3000 || process.env.PORT);
