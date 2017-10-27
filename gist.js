const fetch = require('node-fetch');
const marked = require('marked');
const cache = require('memory-cache');

module.exports.single = (id) => (
  new Promise((resolve, reject) => {
    const c = cache.get(id);

    if (c == null) {
      fetch('https://api.github.com/gists/' + id, { headers: { Authorization: `token ${ process.env.SECRET }` } })
        .then(function(res) {
          return res.json();
        }).then(function(body) {
          if (body.message) {
            return reject(body.message);
          }
        
          if (!body.public) {
            return reject('private');
          }
        
          if (body.owner == null) {
            body.owner = false;
            body.markdown = false;
            body.code = false;

            let f = [];

            for(const file in body.files) {
              if (body.files[file].language == 'Markdown') {
                body.markdown = true;
                body.files[file].content = marked(body.files[file].content);
              } else {
                body.code = true;
              }
              
              body.files[file].language = body.files[file].language || 'none';

              body.files[file].language = body.files[file].language.toLowerCase();
              f.push(body.files[file]);         
            }

            body.files = f;

            resolve(body);
            cache.put(id, body, 150000);
          } else {
            fetch('https://api.github.com/users/' + body.owner.login, { headers: { Authorization: `token ${ process.env.SECRET }` } })
              .then(function(res) {
                return res.json();
              }).then(function(userbody) {
                body.owner.name = userbody.name;
                body.markdown = false;
                body.code = false;

                let f = [];

                for(const file in body.files) {
                  if (body.files[file].language == 'Markdown') {
                    body.markdown = true;
                    body.files[file].content = marked(body.files[file].content);
                  } else {
                    body.code = true;
                  }
                  
                  body.files[file].language = body.files[file].language || 'none';
                  body.files[file].language = body.files[file].language.toLowerCase();
                  f.push(body.files[file]);         
                }

                body.files = f;

                resolve(body);
                cache.put(id, body, 150000);
              }).catch((err) => reject(err));
          }
      }).catch((err) => reject(err));
    } else {
      resolve(c);
    }
  }
));

module.exports.file = (id, file) => (
  new Promise((resolve, reject) => {
    module.exports.single(id).then((body) => {
      for (const f in body.files) {
        if (body.files[f].filename == file) {
          const b = Object.assign({}, body);
          b.files = [body.files[f]];
          
          return resolve(b);
        }
      }
      
      reject(null);
    }).catch((err) => reject(err)); 
  }    
));
