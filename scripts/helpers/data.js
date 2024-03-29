var request = require('sync-request');
var fs = require('fs-extra');
var gsjson = require('google-spreadsheet-to-json');
var deasync = require('deasync');
var config = require('../config.json');
var userHome = require('user-home');
var keys = require(userHome + '/.gu/interactives.json');

var json,
    data = {regions: {}},
    conferences = [];

function fetchData(callback) {
    gsjson({
        spreadsheetId: config.data.id,
        allWorksheets: true,
        credentials: keys.google
    })
    .then(function(result) {
        callback(result);
    })
    .then(function(err) {
        if (err) {
            console.log(err);
        }
    });
}

function setSheetNames(data) {
    data = {
        'illustrators': data[0],
        'images': data[1]
    }

    return data;
}

function injectImagesIntoIllustrators(data) {
    for (var i in data.illustrators) {
        data.illustrators[i].images = [];

        for (var image in data.images) {
            if (data.images[image].name === data.illustrators[i].name) {
                data.illustrators[i].images.push(data.images[image]);
            }
        }
    }

    return data;
}

module.exports = function getData() {
    var isDone = false;

    fetchData(function(result) {
        data = result;
        data = setSheetNames(data);
        data = injectImagesIntoIllustrators(data);

        isDone = true;
    });

    deasync.loopWhile(function() {
        return !isDone;
    });

    return data;
};