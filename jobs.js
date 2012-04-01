(function () {

    var JenkinsMonitor = {};

    var
        jobTemplate,
        jobDataTemplate;



    var config;


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



    var augment = function(job) {
        var display = {};
        var lastBuild = job["lastBuild"];
        var successfulBuild = job["lastSuccessfulBuild"];
        display.building = lastBuild.building;
        display.jobUrl = job.url;
        display.url = lastBuild.url;
        display.name = lastBuild["fullDisplayName"].replace(/ \#.*/, "");
        display.displayName = display.name.replace(/-/g, " ");
        display.result = lastBuild.result || "building";
        display.result = display.result.toLowerCase();
        display.duration = lastBuild.duration;
        display.timestamp = lastBuild.timestamp;

        display.finished = lastBuild.timestamp + lastBuild.duration;
        display.date = moment(lastBuild.timestamp);

        display.howLong = display.date.from(moment(display.finished), true);
        display.fromNow = moment(display.finished).fromNow();
        display.culprits = lastBuild.culprits;

        display.buildStarted = display.date.from(moment(), false);

        //var healthReport = job["healthReport"];
        //display.health = healthReport[0].score;

        if (lastBuild.building) {
            var time = new Date().getTime();
            var length = time - lastBuild.timestamp;

            if (!lastBuild.duration || !successfulBuild.duration) {
                display.estimated = "unknown";
                display.complete = 100;
            } else {
                var when = moment(time + (successfulBuild.duration - lastBuild.duration));
                display.estimated = moment().diff(when);
                if (length > successfulBuild.duration) {
                    display.complete = 100;
                } else {
                    display.complete = ((length / successfulBuild.duration) * 100).toFixed(0);
                }
            }


        }

        return display;
    };



    JenkinsMonitor.updateProject = function (response) {
        //console.info("update project");
        $("#jobs").children().remove();
        var builds = [];
        _.each(response.jobs, function (job) {
            var display = augment(job);
            builds.push(display);
        });
        builds = _.sortBy(builds, function(item) {
            return item[config.sort];
        });
        _.each(builds, function (job) {
            var jobHtml = _.template(jobDataTemplate, {job: job});
            $("#jobs").append(jobHtml);
            if (config.columns > 1) {
                $(".job").css({width: config.columnWidth + "%"});
            }
        });
        $("title").html(response.name);
        setTimeout(JenkinsMonitor.loadData, 5000);
    };



    JenkinsMonitor.loadData = function () {
        //console.info("load data");
        var options = {
            url: "http://" + config.server + "/view/" + config.build + "/api/json",
            data: {
                jsonp: "JenkinsMonitor.updateProject",
                depth: 2
            },
            dataType: "jsonp"
        };
        $.ajax(options);
    };



    $(function () {

        var
            sort,
            req,
            build,
            server,
            columns,
            columnWidth
        ;


        jobTemplate = $("#job-template").html();
        jobDataTemplate = $("#job-data-template").html();

        req = urlParams();
        sort = req["sort"] || "name";
        build = req["build"];
        server = req["server"];
        build = build || "All";

        columns = req["columns"] || 1;

        if (columns > 1) {
            columnWidth =  100 / columns;
        }

        config = {
            server: server,
            build: build,
            columns: columns,
            columnWidth: columnWidth,
            sort: sort
        };


        $(".ajax").live("click", function (e) {
            $.get($(this).attr("href"), function () {
            });
            e.preventDefault();
            return false;
        });

        JenkinsMonitor.loadData();

    });

    window.JenkinsMonitor = JenkinsMonitor;
})();


