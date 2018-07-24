var fs = require('fs-extra');
var handlebars = require('handlebars');
var browserify = require('browserify');
var stringify = require('stringify');
var sass = require('node-sass');
var deasync = require('deasync');
var glob = require('glob-fs')({ gitignore: true });
var markdown = require('markdown').markdown;

module.exports = {
    js: function(path, fileName, absolutePath) {
        fs.removeSync(path + '/' + fileName + '.js');

        var isDone = false;

        browserify('./src/js/' + fileName + '.js').transform(stringify, {
            appliesTo: { includeExtensions: ['.hjs', '.html',] }
        }).bundle(function(err, buf) {
            if (err) {
                console.log(err);
            }
            fs.writeFileSync(path + '/' + fileName + '.js', buf.toString().replace(/\{\{ path \}\}/g, absolutePath).replace(/\{\{path\}\}/g, absolutePath));
            isDone = true;
            console.log('Updated ' + fileName + ' js!');
        });

        deasync.loopWhile(function() {
            return !isDone;
        });
    },

    css: function(path, absolutePath) {
        fs.removeSync(path + '/main.css');

        var isDone = false,
            css;

        sass.render({
            file: 'src/sass/main.scss'
        }, function(err, result) {
            if (err) {
                console.log(err);
            }
            fs.writeFileSync(path + '/main.css', result.css.toString('utf8').replace(/\{\{ path \}\}/g, absolutePath).replace(/\{\{path\}\}/g, absolutePath));
            isDone = true;
            console.log('Updated css!');
        });

        deasync.loopWhile(function() {
            return !isDone;
        });
    },

    html: function(path, data) {
        fs.removeSync(path + '/index.html');

        handlebars.registerHelper('if_eq', function(a, b, opts) {
            if (a == b) {
                return opts.fn(this);
            } else {
                return opts.inverse(this);
            }
        });

        handlebars.registerHelper('marked', function(string) {
            return markdown.toHTML(string);
        });

        handlebars.registerHelper('inc', function(value, options) {
            return parseInt(value) + 1;
        });

        handlebars.registerHelper('loop', function(from, to, inc, block) {
                block = block || {fn: function () { return arguments[0]; }};

                var data = block.data || {index: null};

                var output = '';
                for (var i = from; i <= to; i += inc) {
                    data['index'] = i;
                    output += block.fn(i, {data: data});
                }

                return output;
        });

        handlebars.registerHelper('if_even', function(conditional, options) {
         if((conditional % 2) == 0) {
           return options.fn(this);
         } else {
           return options.inverse(this);
         }
        });

        handlebars.registerHelper('if_odd', function(conditional, options) {
         if((conditional % 2) !== 0) {
           return options.fn(this);
         } else {
           return options.inverse(this);
         }
        });

        handlebars.registerHelper('match-number', function(index) {
            return (index + 2) / 2;
        });

        var html = fs.readFileSync('src/templates/index.html', 'utf8');
        var template = handlebars.compile(html);

        var partials = glob.readdirSync('src/templates/**/*.*');

        partials.forEach(function(partial) {
            var name = partial.replace('src/templates/', '').split('.')[0];
            var template = fs.readFileSync(partial, 'utf8');

            handlebars.registerPartial(name, template);
        });

        fs.writeFileSync(path + '/index.html', template(data));
        console.log('Updated html!');
    },

    static: function(path) {
        fs.emptyDirSync(path + '/assets');
        fs.mkdirsSync(path + '/assets');
        fs.copySync('src/assets', path + '/assets');
        console.log('Updated static assets');
    }
} 