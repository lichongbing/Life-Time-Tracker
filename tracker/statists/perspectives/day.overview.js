/**
 * life overview perspective
 */
'use strict';

var msg = require('../../message');
var util = require('../../util');
var helper = require('../../helper');

exports.focus = function (options, scanResult) {
    var date = options.dateStr,
        logs = scanResult.logs,
        trackedTime = 0,
        wakeMoment,
        lastMoment,
        sleepMoment;
    var statResult = {
        date: date,
        options: scanResult.options,
        logs: scanResult.logs
    };

    //check the correctness of time frequence for the logs
    helper.checkLogSequence(logs);
    statResult.classes = helper.getLogClassesFromDays([scanResult]).sort(frequenceDesc);
    statResult.tags = helper.getTagsFromDays([scanResult]).sort(frequenceDesc);
    statResult.projects = helper.getAllProjects([scanResult]);

    //last index of the logs
    var lastIndex = logs.length - 1;
    logs.forEach(function(log, index) {
        if (isGetUpLog(log, index)) {
            wakeMoment = log.start;
        } else if (isSleepTime(log, index, lastIndex)){
            sleepMoment = log.start;
        } else if (log.sign.indexOf('off') >= 0) {
            statResult.offDutyMoment = log.start;
        }
        if (log.len !== undefined) {
            trackedTime += log.len;
        }
        if (lastIndex === index) {
            lastMoment = log.end;
        }
    });
    function isGetUpLog(log, index) {
        var startTS = new Date(log.start).getTime(),
            endTS = new Date(log.end).getTime();
        return endTS === startTS && index === 0;
    }

    function isSleepTime(log, index, lastIndex) {
        var startTS = new Date(log.start).getTime(),
            endTS = new Date(log.end).getTime();
        return endTS === startTS && index === lastIndex;
    }

    //calculate the activeTime and unTrackedTime
    var activeTime = 0, unTrackedTime;
    activeTime = helper.timeSpan(wakeMoment, sleepMoment || lastMoment);
    unTrackedTime = activeTime - trackedTime;
    //validate the activeTime and unTrackedTime
    checkActiceTime(activeTime, unTrackedTime);

    //store the stat result
    statResult.trackedTime = trackedTime;
    statResult.wakeMoment = wakeMoment;
    statResult.sleepMoment = sleepMoment;
    statResult.activeTime = activeTime;
    statResult.unTrackedTime = unTrackedTime;
    statResult.sleepTime = helper.calculateSleepTime(date, sleepMoment);
    statResult.classTime = helper.groupTimeByLogClass(logs, statResult.classes);
    statResult.tagTime = helper.groupTimeByTag(logs);
    statResult.projectTime = helper.groupTimeByProject(logs);
    return statResult;
    function frequenceDesc(a, b) {
        return b.frequence - a.frequence;
    }

    function checkActiceTime(activeTime, unTrackedTime) {
        if (unTrackedTime < 0) {
            msg.error(date + '\'s trackedTime is bigger than activeTime, that\'s impossible. ' + 'trackedTime = ' + trackedTime + ' activeTime = ' + activeTime);
        } else if (unTrackedTime > 200) {
            msg.warn(date + '\'s untrackedTime is too much untrackedTime = ' + unTrackedTime);
        }
    }
};


