var yaml = require('js-yaml');
var UglifyJS = require("uglify-js");
var fs = require('fs');

var MinifyYamlType = new yaml.Type('!minify', {
  kind: 'scalar',
  construct: function(data) {
    return UglifyJS.minify(data).code;
  }
});

var SCHEMA = yaml.Schema.create([ MinifyYamlType ]);

var templateBody = fs.readFileSync('./cloudformation.yml', 'utf-8');
var template = yaml.load(templateBody, { schema: SCHEMA });

fs.writeFileSync('./cloudformation.json', JSON.stringify(template, null, '  '), 'utf-8');
