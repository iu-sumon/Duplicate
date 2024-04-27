// Get Watchlist
function getallwatchlist(watchlist_widget_id) {
    var options = [
        { text: 'List', value: 'default', disabled: true },
        { text: 'Favorite', value: 'Favorite' },
        { text: 'All instrument', value: 'All instrument', disabled: true },
        { text: 'BOND (Public)', value: 'BOND (Public)' },
        { text: 'SC', value: 'SC' },
        { text: 'ATB', value: 'ATB' },
        { text: 'BOND (Government)', value: 'BOND (Government)', disabled: true },
        { text: 'SPOT Mkt', value: 'SPOT Mkt' },
        { text: 'BLOCK', value: 'BLOCK' },
    ];

    if (watchlist_widget_id == 'all') {
        var select_element = ".user_watchlists";
        var selected_value = "";
        var exists;
        $(select_element).each(function (i, obj) {
            $.get("/shared/getallwatchlist/", function (data) { 
                if (obj.childNodes.length != 0) {
                    var table_id = obj.id.replace('select_', '').replace('add_', '').replace(/\s+/g, ''); 
                    var pid_selected = document.querySelector("#profile li.profile-selected-li");
                    var pid = pid_selected.getAttribute("data-value");

                    selected_value = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_selected');
                    exists = data.includes(selected_value) || options.some(option => option.value == selected_value);
                    obj.innerHTML = '';
                } 
                var optionsHTML = '';  
                options.forEach(option => {
                    optionsHTML += '<option value="' + option.value + '" ' + (option.disabled ? 'disabled' : '') + '>' + option.text + '</option>';
                });

                for (i = 0; i < data.length; i++) { 
                    optionsHTML += '<option value="' + data[i] + '" ' + (data[i] == selected_value ? 'selected' : '') + '>' + data[i] + '</option>';
                } 
                obj.innerHTML = optionsHTML;
 
                if (selected_value !=null && exists){ 
                    $("#" + obj.id).val(selected_value);
                    setTimeout(function () {
                        $("#" + obj.id).trigger('change');
                    }, 1500);  
                } 
                else{ 
                    var firstOption =  $("#" + obj.id).find("option:eq(1)");
                    $("#" + obj.id).val(firstOption.attr("value"));
                    localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_selected', firstOption.attr("value"))
                    setTimeout(function () {
                        $("#" + obj.id).trigger('change');
                    }, 1500);  
                } 
            });
        });
    } else {
        var select_element_default = "#select_" + watchlist_widget_id;
        $.get("/shared/getallwatchlist/", function (data) {
            $(select_element_default).empty();
            options.forEach(option => {
                var watchlist = document.createElement("option");
                watchlist.text = option.text;
                watchlist.value = option.value;
                watchlist.disabled = option.disabled || false;
                document.querySelector(select_element_default).add(watchlist);
            });
            for (i = 0; i < data.length; i++) {
                var watchlist = document.createElement("option");
                watchlist.text = data[i];
                watchlist.value = data[i];
                document.querySelector(select_element_default).add(watchlist);
            }
            var defaultOption = $(select_element_default).find("option:eq(1)");
            $(select_element_default).val(defaultOption.attr("value"));
            setTimeout(function () {
                $(select_element_default).change();
            }, 1500);  
        });
    }
}

// ===============================================global.js
if (name === "watchlist") {
    var [widget_serial, widget_id, widget_count] = generate_multi_widget('Watchlist', 'watchlists', 'wl_table_')
    // if(widget_count > 0){
    //     show_flash_messages('Watchlist Widget already added', 'danger');
    // } else {
    $.get('shared/widget_watchlist_advanced/' + widget_serial, function (data) {
        var content = data;
        var title = 'Watchlist ' + widget_serial;
        addWidget(title, content, 200, 200);
        symbol_input();
        getallwatchlist('all');
        localStorage.removeItem(system_username + '_' + profile_page + '_' + pid + '_' + title + '_color');  
        // init_watchlist_widget(widget_id);
    });
    // }
}
if (name === "orders") { 
    var [widget_serial, widget_id, widget_count] = generate_multi_widget('Order Terminal', 'orderterminals', 'terminal_')
        if(widget_serial == 3){
            return;
        } 
        $.get('shared/widget_orderterminal/' + widget_serial, function (data) {
            var content = data;
            var title = 'Order Terminal ' + widget_serial;
            addWidget(title, content, 200, 200);
            localStorage.removeItem(system_username + '_' + profile_page + '_' + pid + '_' + title + '_color'); 
        }); 
}


// Generate Multiple Widgets
function generate_multi_widget(widget_title, widget_name, widget_selector) {
    var pid_selected = document.querySelector("#profile li.profile-selected-li");
    var pid = pid_selected.getAttribute("data-value");
    var existing_widget_list = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + widget_name);

    if (existing_widget_list == null) {
        existing_widget_list = [];
        let exist_widget_title = $('.lm_title');
        for (var i = 0; i < exist_widget_title.length; i++) {
            let exist_widget_text = $(exist_widget_title[i]).text();
            if (exist_widget_text.includes(widget_title)) {
                var title_number = parseInt(exist_widget_text.match(/\d+/)[0]);
                existing_widget_list.push(widget_selector + title_number);
            }
        }
        existing_widget_list.sort();
        localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + widget_name, existing_widget_list.toString());
        existing_widget_list = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + widget_name);
    }

    var widget_count = $('.lm_title:contains(' + widget_title + ')').length;
    var widget_serial = '';
    var widget_id = '';

    // Remove commas from the first position
    if (existing_widget_list != null && existing_widget_list.startsWith(',')) {
        existing_widget_list = existing_widget_list.replace(/^,+/g, '');
    }

    var parse_widget_list = existing_widget_list ? existing_widget_list.replaceAll(widget_selector, '') : null;
    parse_widget_list = parse_widget_list ? parse_widget_list.split(',').map(Number) : [];
    existing_widget_list = existing_widget_list ? existing_widget_list.split(',') : [];
 
    var missing_id;
    if (parse_widget_list) {
        for (var i = 1; i <= parse_widget_list.length; i++) {
            if (parse_widget_list.indexOf(i) == -1) {
                missing_id = i;
                break;
            }
        }
    }

    if (missing_id === undefined) {
         // no missing widget id in array sequence
        widget_count += 1;
        widget_serial = widget_count;
        widget_id = widget_selector + widget_count;
    } else {
        // found missing id in array sequence
        widget_serial = missing_id;
        widget_id = widget_selector + missing_id;
    }
    if(widget_id == 'terminal_3')
    {
        return;
    }
    existing_widget_list.push(widget_id);
    existing_widget_list.sort();

    localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + widget_name, existing_widget_list.toString());

    return [widget_serial, widget_id, widget_count];
}


// =======================================================trade portal.js
    // Initalize Watchlist loading
    if ($('.watchlist_table').length >0) {
        symbol_input();
        getallwatchlist('all');
    }

    function stack_update(table_id, widget) {
        // Watchlist Widget
        if (widget == 'watchlist_widget') {
            let watchlist_id = table_id;
            let pid_selected = document.querySelector("#profile li.profile-selected-li");
            let pid = pid_selected.getAttribute("data-value"); 

            let existing_watchlist_selection = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + watchlist_id + '_selected');

            if (existing_watchlist_selection != null) {
                localStorage.removeItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + watchlist_id + '_selected');
            }

            let existing_watchlist_widget_list = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'watchlists');
    
            if (existing_watchlist_widget_list != null) {
                existing_watchlist_widget_list = existing_watchlist_widget_list.replace(watchlist_id + ',', '').replace(watchlist_id, '');

                if (existing_watchlist_widget_list == '') {
                    localStorage.removeItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'watchlists');
                } else {
                    localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'watchlists', existing_watchlist_widget_list);
                }
            } 
        }
        // MarketDepth Widget
        if (widget == 'marketdepth_widget') {
            let marketdepth_id = table_id; 
            let pid_selected = document.querySelector("#profile li.profile-selected-li");
            let pid = pid_selected.getAttribute("data-value"); 

            let existing_marketdepth_widget_list = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'marketdepths');

            if (existing_marketdepth_widget_list != null) {
                existing_marketdepth_widget_list = existing_marketdepth_widget_list.replace(marketdepth_id + ',', '').replace(marketdepth_id, '');
                if (existing_marketdepth_widget_list == '') {
                    localStorage.removeItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'marketdepths');
                } else {
                    localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'marketdepths', existing_marketdepth_widget_list);
                }
            }

        }

           // Order terminal Widget
           if (widget == 'orderterminal_widget') {
            let orderterminal_id = table_id; 
            let pid_selected = document.querySelector("#profile li.profile-selected-li");
            let pid = pid_selected.getAttribute("data-value"); 

            let existing_orderterminal_widget_list = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'orderterminals');

            if (existing_orderterminal_widget_list != null) {
                existing_orderterminal_widget_list = existing_orderterminal_widget_list.replace(orderterminal_id + ',', '').replace(orderterminal_id, '');
                if (existing_orderterminal_widget_list == '') {
                    localStorage.removeItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'orderterminals');
                } else {
                    localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'orderterminals', existing_orderterminal_widget_list);
                }
            }

        }
       
    }

    function tab_update(item) {
        // Watchlist Widget 
        if (item.config.type == "component" && item.config.title.includes('Watchlist')) {
            let watchlist_id = item.container._contentElement[0].childNodes[4].childNodes[1].id; 
            let pid_selected = document.querySelector("#profile li.profile-selected-li");
            let pid = pid_selected.getAttribute("data-value"); 

            let existing_watchlist_selection = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + watchlist_id + '_selected');
            if (existing_watchlist_selection != null) {
                localStorage.removeItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + watchlist_id + '_selected');
            }

            let existing_watchlist_widget_list = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'watchlists');

            if (existing_watchlist_widget_list != null) {
                existing_watchlist_widget_list = existing_watchlist_widget_list.replace(watchlist_id + ',', '').replace(watchlist_id, '');
                if (existing_watchlist_widget_list == '') {
                    localStorage.removeItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'watchlists');
                } else {
                    localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'watchlists', existing_watchlist_widget_list);
                }
            }
        }
        // MarketDepth Widget
        if (item.config.type == "component" && item.config.title.includes('Market Depth')) {
            let element_id = item.container._contentElement[0].childNodes[4].querySelector(':first-child').id;
            let marketdepth_id = element_id.replace('symdata_', '').replace(/\s+/g, ''); 

            let pid_selected = document.querySelector("#profile li.profile-selected-li"); 
            let pid = pid_selected.getAttribute("data-value"); 

            let existing_marketdepth_widget_list = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'marketdepths');

            if (existing_marketdepth_widget_list != null) {
                existing_marketdepth_widget_list = existing_marketdepth_widget_list.replace(marketdepth_id + ',', '').replace(marketdepth_id, '');
                if (existing_marketdepth_widget_list == '') {
                    localStorage.removeItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'marketdepths');
                } else {
                    localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'marketdepths', existing_marketdepth_widget_list);
                }
            }

        }

        // Order Terminal
        if (item.config.type == "component" && item.config.title.includes('Order Terminal')) {
            let orderterminal_id = item.container._contentElement[0].childNodes[4].id; 
            let pid_selected = document.querySelector("#profile li.profile-selected-li");
            let pid = pid_selected.getAttribute("data-value"); 

            let existing_orderterminal_widget_list = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'orderterminals');

            if (existing_orderterminal_widget_list != null) {
                existing_orderterminal_widget_list = existing_orderterminal_widget_list.replace(orderterminal_id + ',', '').replace(orderterminal_id, '');
                if (existing_orderterminal_widget_list == '') {
                    localStorage.removeItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'orderterminals');
                } else {
                    localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + 'orderterminals', existing_orderterminal_widget_list);
                }
            }

        }

        // Time & Sales Ticker Widget
        if (item.config.type == "component" && item.config.title =='Time & Sales Ticker') { 
            subscribeUnsubscribeTickerChannel(false);
        }
    }