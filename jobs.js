(function () {

    var JenkinsMonitor = {};

    var
        jobTemplate,
        jobDataTemplate,
        sort = "name",
        columns,
        columnWidth
        ;




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



    var create = function(job) {
        var display = {};

        //console.info(job);

        var lastBuild = job["lastBuild"];

        var successfulBuild = job["lastSuccessfulBuild"];

        display.building = lastBuild.building;
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
            var length = new Date().getTime() - lastBuild.timestamp;
            display.complete = ((length / successfulBuild.duration) * 100).toFixed(0);
        }

        return display;
    };



    JenkinsMonitor.updateProject = function (response) {
        $("#jobs").children().remove();
        var builds = [];
        _.each(response.jobs, function (job) {
            var display = create(job);
            builds.push(display);
        });
        builds = _.sortBy(builds, function(item) {
            return item[sort];
        });
        _.each(builds, function (job) {
            var jobHtml = _.template(jobDataTemplate, {job: job});
            $("#jobs").append(jobHtml);
            if (columns > 1) {
                $(".job").css({width: columnWidth + "%"});
            }
        });
        $("title").html(response.name);
        setTimeout(JenkinsMonitor.update, 2000);
    };


    $(function () {

        var req,
            build,
            server;

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


        $(".ajax").live("click", function (e) {
            $.get($(this).attr("href"), function () {
            });
            e.preventDefault();
            return false;
        });

        var options = {
            url: "http://" + server + "/view/" + build + "/api/json",
            data: {
                jsonp: "JenkinsMonitor.updateProject",
                depth: 2
            },
            dataType: "jsonp"
        };
        JenkinsMonitor.update = function () {
            $.ajax(options);
        };
        JenkinsMonitor.update();

    });

    window.JenkinsMonitor = JenkinsMonitor;
})();


