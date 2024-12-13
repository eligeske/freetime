var logoSrc = "../imgs/hidriv_logo.png";
$(document).ready(function () {
  var lib = new Lib();
  var timing = new Timing();
  var appComponents = new AppComponents();
  var fileName = lib.getURLParam("fileName");

  var ResultsByCategoryGrid = views.ResultsByCategoryGrid;

  var domFileStorage = new DOMFileStorageExt(function (storage) {
    domFileStorage = storage;

    var refreshView = function () {
      domFileStorage.readEvent(fileName, function (fileContents) {
        var ev = JSON.parse(fileContents);
        var cache = DataTemplate.cacheTemplate;
        var strg = new MemoryStorage(
          ev.storage,
          ev.model,
          ev.primaryKey,
          cache,
          function () {}
        );
        var eventTemplate = DataTemplate.eventTemplate;
        var currentEvent = new Event(ev, cache, domFileStorage, eventTemplate);

        var categories = $.map(cache.PodiumCategory.id, function (cat) {
          return cat;
        });

        var newHtmlContent = [];
        var refreshCallback = !firstLoaded
          ? onAllGridsAppended
          : onAllGridsReloaded;

        var appendCategoryGrid = function (i) {
          var recCall = function () {
            i++;
            if (i >= categories.length) {
              // get scroll pos, replace content with new, after-refresh-actions, set scroll pos
              var curScrollTop = $("#print_cont")[0].scrollTop;
              $("#print_cont").html(newHtmlContent);

              refreshCallback();

              var curScrollHeight = $("#print_cont")[0].scrollHeight;
              if (curScrollTop < curScrollHeight) {
                $("#print_cont")[0].scrollTop = curScrollTop;
              }
            } else {
              appendCategoryGrid(i);
            }
          };

          if (
            currentEvent.settings.timingType != "multi-group-start" ||
            cache.CategoryStart.podiumCategoryId[categories[i].id]
          ) {
            // check if category started

            var grid = new ResultsByCategoryGrid(
              categories[i],
              currentEvent,
              timing,
              appComponents.Toolbar,
              appComponents.Grid,
              function () {
                var head = grid.html.find(".head");
                head.remove();
                var tr = head.find("tr");
                grid.html.find("table").prepend($("<thead>", { html: tr }));
                newHtmlContent.push(grid.html);

                recCall();
              }
            );
          } else {
            recCall();
          }
        };

        if (categories.length) {
          appendCategoryGrid(0);
        }
      });
    };

    var setButtonHandlers = function () {
      $("#print_btn").click(function () {
        refreshView();
      });
      $("#close_btn").click(function () {
        window.close();
      });
    };

    var setPageTitle = function () {
      $("title").html("All results - hidriv timing");
    };

    var appendLogo = function () {
      $("#print_cont")
        .children()
        .first()
        .find(".toolbar")
        .append($("<img>", { src: logoSrc, class: "print-logo" }));
    };

    var firstLoaded = false;

    var onAllGridsAppended = function () {
      firstLoaded = true;
      setButtonHandlers();
      setPageTitle();
      appendLogo();
    };

    var onAllGridsReloaded = function () {
      appendLogo();
    };

    setInterval(function () {
      refreshView();
    }, 20 * 1000);

    refreshView();
  });
});
