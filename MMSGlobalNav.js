_spBodyOnLoadFunctionNames.push("loadGlobalNav");

function loadGlobalNav() {
    jq('#suiteBar').after("<div id='GNavContainer' class='ms-dialogHidden' style='min-height:30px;'></div>");
    var style = "background-image: url(\"/sites/branding/Style Library/milliman/img/MillimanLogo200x50.png\"); width: 180px; display: block; height: 40px; background-size: 180px;background-position-y:-2px;";

    var millimanIcon = "<a style='" + style + "' href='/'></a>";
    jq('#DeltaSuiteLinks').before(millimanIcon);
    //jq(document).ready(function () {
    if (_spPageContextInfo.webAbsoluteUrl.indexOf("https://uat13-") != -1 || _spPageContextInfo.webAbsoluteUrl.indexOf("http://int1-") != -1) {
        checkNavTimeStamp(localStorage.MGNavDev);
    } else if (_spPageContextInfo.webAbsoluteUrl.indexOf("https://intranet") != -1 || _spPageContextInfo.webAbsoluteUrl.indexOf("https://teams") != -1) {
        checkNavTimeStamp(localStorage.MGNav);
    }

}

function checkNavTimeStamp(obj) {
    if (obj) {
        try {
            var gn = JSON.parse(obj);
        } catch (e) {
            queryMMS();
        }
        if (Date.now() <= gn.expires) {
            jq('#GNavContainer').html(gn.html);
        } else {
            queryMMS();
        }
    } else {
        queryMMS();
    }
}
//});
function queryMMS() {
    console.log("In queryMMS()");
    var scriptbase = _spPageContextInfo.siteAbsoluteUrl + "/_layouts/15/";
    /*
    jq.getScript(scriptbase + "SP.Runtime.js", function () {

        jq.getScript(scriptbase + "SP.js", function () {

            jq.getScript(scriptbase + "SP.Taxonomy.js", getAllTerms);

        });
    }
    );
    */
    /*
    SP.SOD.executeFunc("sp.js", null, function () {
        SP.SOD.executeFunc("sp.runtime.js", null, function () {
            SP.SOD.executeFunc("sp.taxonomy.js", null, getAllTerms);
        });
    });
    */
    SP.SOD.executeFunc("sp.taxonomy.js", null, null);
    ExecuteOrDelayUntilScriptLoaded(getAllTerms, "sp.taxonomy.js");

}

var getAllTerms = function () {
    var context = new SP.ClientContext.get_current();
    //SP.SOD.executeFunc("SP.Taxonomy.js", 'SP.ClientContext', function () {
    //Current Taxonomy Session
    var taxSession = SP.Taxonomy.TaxonomySession.getTaxonomySession(context);
    //Term Stores
    var termStores = taxSession.get_termStores();
    /*
    //Name of the Term Store from which to get the Terms and GUID of Term Set from which to get the Terms.
    //INT environment
    //var termStore = termStores.getByName("Managed Metadata Proxy");
    //var termSet = termStore.getTermSet("4ce7131d-48a8-4640-a846-6fc8322d9614");

    //UAT environment
    //var termStore = termStores.getByName("Managed Metadata Services");
    //var termSet = termStore.getTermSet("5f2e919d-6cd0-4175-a7cf-0c4e9ddc647b");

    //PRODUCTION environment
    //var termStore = termStores.getByName("Managed Metadata Service");
    //var termSet = termStore.getTermSet("fc46ff49-a629-48ff-b7b4-b5c779f8e044");
    */

    //Name of the Term Store from which to get the Terms and GUID of Term Set from which to get the Terms.
    //PROD environment
    if (_spPageContextInfo.webAbsoluteUrl.indexOf("https://intranet") != -1 || _spPageContextInfo.webAbsoluteUrl.indexOf("https://teams") != -1) {
        var termStore = termStores.getByName("Managed Metadata Service");
        var termSet = termStore.getTermSet("fc46ff49-a629-48ff-b7b4-b5c779f8e044");
    }
    //UAT environment
    else if (_spPageContextInfo.webAbsoluteUrl.indexOf("https://uat13-") != -1) {
        var termStore = termStores.getByName("Managed Metadata Services");
        var termSet = termStore.getTermSet("5f2e919d-6cd0-4175-a7cf-0c4e9ddc647b");
    }
    //INT environment
    else if (_spPageContextInfo.webAbsoluteUrl.indexOf("http://int1-") != -1) {
        var termStore = termStores.getByName("Managed Metadata Proxy");
        var termSet = termStore.getTermSet("4ce7131d-48a8-4640-a846-6fc8322d9614");
    }
    var allTerms = termSet.getAllTerms();
    context.load(termSet);
    context.load(allTerms, 'Include(Name,Id, Description, PathOfTerm, LocalCustomProperties, CustomSortOrder)');
    context.executeQueryAsync(function () {
        tree = {
            term: allTerms,
            children: []
        };
        var termsEnumerator = allTerms.getEnumerator();

        var termList = "Terms: \n";
        // Loop through each term
        while (termsEnumerator.moveNext()) {
            var currentTerm = termsEnumerator.get_current();
            var currentTermPath = currentTerm.get_pathOfTerm().split(';');
            var children = tree.children;

            // Loop through each part of the path
            for (var i = 0; i < currentTermPath.length; i++) {
                var foundNode = false;

                for (var j = 0; j < children.length; j++) {
                    if (children[j].name === currentTermPath[i]) {
                        foundNode = true;
                        break;
                    }
                }

                // Select the node, otherwise create a new one
                var term = foundNode ? children[j] : {
                    name: currentTermPath[i],
                    children: []
                };

                // If we're a child element, add the term properties
                if (i === currentTermPath.length - 1) {
                    //term.term = currentTerm;
                    term.title = currentTerm.get_name();
                    term.guid = currentTerm.get_id().toString();
                    term.description = currentTerm.get_description();
                    term.path = currentTerm.get_pathOfTerm();
                    term.simpleLinkUrl = currentTerm.get_localCustomProperties()._Sys_Nav_SimpleLinkUrl;
                    term.childOrder = currentTerm.get_customSortOrder();
                }

                // If the node did exist, let's look there next iteration
                if (foundNode) {
                    children = term.children;
                }
                // If the segment of path does not exist, create it
                else {
                    children.push(term);

                    // Reset the children pointer to add there next iteration
                    if (i !== currentTermPath.length - 1) {
                        children = term.children;
                    }
                }
            }
        }
        //console.log(tree);
        renderMMSGlobalNav(tree);

    }, function (sender, args) {

        //console.log(args.get_message());

    });
    //});
}

function renderTerm_old(term) {
    var html = '<li><a href="' + term.simpleLinkUrl + '">' + term.title + '</a>';

    if (term.children && term.children.length) {
        html += '<ul>';

        for (var i = 0; i < term.children.length; i++) {
            html += renderTerm(term.children[i]);
        }

        html += '</ul>';
    }

    return html + '</li>';
}

function renderMMSGlobalNav(tree) {
    var html = '<ul class="nav navbar-nav">';

    // Kick off the term rendering
    for (var i = 0; i < tree.children.length; i++) {
        html += renderTerm(tree.children[i]);
    }
    html += '</ul>';
    html += '<ul class="nav navbar-nav navbar-right" style="padding-right:30px;">' +
        '<li class="dropdown"><a style="border-right:1px solid black;padding:0px 5px 0px 5px !important;margin:5px 0px 5px 0px;" role="button" href="http://www.milliman.com"> Milliman.com </a></li>' +
        '<li class="dropdown"><a style="border-right:1px solid black;padding:0px 5px 0px 5px !important;margin:5px 0px 5px 0px;" role="button" href="/pages/intranethelp.aspx"> Help </a></li>' +
        '<li class="dropdown"><a style="padding:0px 5px 0px 5px !important;margin:5px 0px 5px 0px;" role="button" onclick="window.print();return false;" href="#"> Print </a></li>' +
        '</ul>';
    //PRODUCTION environment
    //d.setDate(d.getDate()+1);
    //UAT and INT environments
    //d.setSeconds(d.getSeconds() + 5);
    var d = new Date();
    var urlBeginning = "";
    var isProd = false;
    //PROD environment
    if (_spPageContextInfo.webAbsoluteUrl.indexOf("https://intranet") != -1 || _spPageContextInfo.webAbsoluteUrl.indexOf("https://teams") != -1) {
        d.setDate(d.getDate() + 1);
        urlBeginning = "https://intranet";
        isProd = true;
    }
    //UAT environment
    else if (_spPageContextInfo.webAbsoluteUrl.indexOf("https://uat13-") != -1) {
        d.setSeconds(d.getSeconds() + 10);
        urlBeginning = "https://uat13-intranet";
    }
    //INT environment
    else if (_spPageContextInfo.webAbsoluteUrl.indexOf("http://int1-") != -1) {
        d.setSeconds(d.getSeconds() + 2);
        urlBeginning = "http://int1-intranet";
    }
    html = '<div class="row" style="border-top:1px solid white;">' +
        '<div class="col-sm-12 col-md-12 col-lg-12 col-xl-12" style="padding: 0px !important;">' +
        '<div class="container" style="padding: 0px;">' +
        '<nav class="navbar navbar-default" style="margin-bottom: 0px; background-color: rgb(204, 204, 204); border:none;">' +
        '<div>' +
        '<div class="navbar-header">' +
        '<button class="navbar-toggle collapsed" aria-expanded="false" style="background-color: rgb(238, 238, 238);" type="button" data-toggle="collapse" data-target="#millimanGlobalNav">' +
        '<span class="sr-only"></span>' +
        '<span class="icon-bar"></span>' +
        '<span class="icon-bar"></span>' +
        '<span class="icon-bar"></span>' +
        '</button>' +
        '<a class="pull-left fa fa-home millimanHomeIcon" href="' + urlBeginning + '.milliman.com"></a>' +
        '</div>' +
        '<div class="collapse navbar-collapse" id="millimanGlobalNav" style="padding-left: 120px !important;">' +
        //'<ul>' +
        html +
        //'</ul>'+
        '</div>' +
        '</div>' +
        '</nav>' +
        '</div>' +
        '</div>' +
        '</div>';

    if (isProd) {
        window.localStorage.MGNav = JSON.stringify({
            html: html,
            expires: d.getTime()
        });
    } else {
        window.localStorage.MGNavDev = JSON.stringify({
            html: html,
            expires: d.getTime()
        });
    }

    jq('#GNavContainer').html(html);

    //window.localStorage.MMSGlobalNav = JSON.stringify({ html: '<ul>' + html + '</ul>', expires: d.getTime() });
    //jq('#millimanGlobalNav').html('<ul>' + html + '</ul>');
    //console.log("Global Navigation reloaded.");
}

function sortChildren(term) {
    if (term.childOrder) {
        var order = term.childOrder.split(':');
        for (i = 0; i < order.length; i++) {
            var result = jq.grep(term.children, function (child) {
                return child.guid === order[i];
            });
            if (result[0]) {
                result[0].order = i;
            }
        }
    }
    return term;
}

function renderTerm(term) {
    var html = '';
    var term = sortChildren(term);
    term.children.sort(function (a, b) {
        return a.order - b.order;
    });
    if (term.children && term.children.length) {
        html += ' <li class="dropdown">' +
            '<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"> ' + term.title + ' <span class="caret"></span></a>' +
            '<ul class="dropdown-menu">';
        //html += '<ul>';

        for (var i = 0; i < term.children.length; i++) {
            html += '<li><a href="' + term.children[i].simpleLinkUrl + '">' + term.children[i].title + '</a></li>';
        }

        html += '</ul></li>';
    }
    return html;
}