var yaml = require('js-yaml');
var UglifyJS = require("uglify-js");
var fs = require('fs');
var traverse = require('traverse');

function minify(path) {
  return UglifyJS.minify(path).code;
}

var templateBody = fs.readFileSync('./cloudformation.yml', 'utf-8');
var template = yaml.safeLoad(templateBody);

traverse(template).forEach(function(val) {
  if (typeof val === 'string' && val.indexOf('!js ') === 0) {
    var code = val.slice(4);
    this.update(eval(code));
  }
});

fs.writeFileSync('./cloudformation.json', JSON.stringify(template, null, '  '), 'utf-8');
