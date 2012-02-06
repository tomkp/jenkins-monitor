(function () {

    var JenkinsMonitor = {};

    var jobs,
        count,
        total;

    /*
     * JavaScript Pretty Date
     * Copyright (c) 2011 John Resig (ejohn.org)
     * Licensed under the MIT and GPL licenses.
     */
    // Takes an ISO time and returns a string representing how
    // long ago the date represents.
    var prettyDate = function (time) {
        var date = new Date((time || "").replace(/-/g, "/").replace(/[TZ]/g, " ")),
            diff = (((new Date()).getTime() - date.getTime()) / 1000),
            day_diff = Math.floor(diff / 86400);

        if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
            return;

        return day_diff == 0 && (
            diff < 60 && "just now" ||
                diff < 120 && "1 minute ago" ||
                diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
                diff < 7200 && "1 hour ago" ||
                diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
            day_diff == 1 && "Yesterday" ||
            day_diff < 7 && day_diff + " days ago" ||
            day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
    };


    var urlParams = function () {
        var param,
            result = {},
            url = window.location.href,
            parameters = url.slice(url.indexOf('?') + 1).split('&'),
            i = parameters.length;
        for (; i--;) {
            param = parameters[i].split('=');
            result[param[0]] = param[1];
        }
        return result;
    };


    JenkinsMonitor.updateJob = function (job) {
        count++;
        job.name = job.fullDisplayName.replace(/ \#.*/, "");
        job.result = job.result || "building";
        job.result = job.result.toLowerCase();
        job.date = Dates.format(new Date(job.timestamp), "EEE dd MMM yyyy HH:mm:ss");
        job.prettyDate = prettyDate(job.date);
        jobs.push(job);
    };


    JenkinsMonitor.updateProject = function (response) {
        jobs = [];
        count = 0;
        total = response.jobs.length;
        _.each(response.jobs, function (job) {
            var options = {
                url: "http://build.search.bskyb.com/job/" + job.name + "/lastBuild/api/json",
                data: {
                    jsonp: "JenkinsMonitor.updateJob"
                },
                dataType: "jsonp"
            };
            $.ajax(options);
        });
        $("title").html(response.name);
    };


    $(function () {

        var req,
            build,
            server,
            jobsTemplate;


        jobsTemplate = $("#jobs-template").html();

        req = urlParams();
        build = req["build"];
        server = req["server"];
        build = build || "All";


        $(".ajax").live("click", function (e) {
            $.get($(this).attr("href"), function () {
            });
            e.preventDefault();
            return false;
        });

        var monitor = function () {
            if (count === total) {

                jobs = _.sortBy(jobs, function (job) {
                    return job.name;
                });

                var html = _.template(jobsTemplate, {jobs: jobs});
                $("#jobs").html(html);

            }
        };
        monitor();
        setInterval(monitor, 1000);

        var options = {
            url: "http://" + server + "/view/" + build + "/api/json",
            data: {
                jsonp: "JenkinsMonitor.updateProject"
            },
            dataType: "jsonp"
        };
        var update = function () {
            $.ajax(options);
        };
        update();
        setInterval(update, 10000);
    });

    window.JenkinsMonitor = JenkinsMonitor;
})();


