var ignorewatchlist = ['BOND (Public)' , 'SC', 'ATB', 'BOND (Government)', 'SPOT Mkt', 'BLOCK'];

function init_watchlist_widget(watchlist_widget_id) {
    symbol_input();
    //getallwatchlist(watchlist_widget_id);
}

// Create New Watchlist
function create_watchlist(element_id) {
    var table_id = element_id.replace('create_', '').replace(/\s+/g, '');
    var modal = $("#main-page-modal");
    var pageLoader = $('#page-loading-indicator').html();
    var url = "portfolio/add_watchlist/" + table_id;
    modal.modal({ show: true });
    modal.find('.modal-title').text('');
    modal.find('.modal-body').html(pageLoader).load(url);
}
// Remove Watchlist
function delete_watchlist(element_id) {
    var select_id = element_id.replace('remove_', '').replace(/\s+/g, '');
    var name = $('#select_' + select_id).val();
    var url = '/shared/removewatchlist/';
    $.get(url, { name: name })
        .done(function (data) {
            show_flash_messages(data, 'success');
            getallwatchlist('all');
        })
        .fail(function (data) {
            show_flash_messages(data.responseText, 'danger');
        });
}
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

// Variable to track the latest request's AbortController
var fetchController = null;

// Load Watchlist
function load_watchlist(wlname, element_id, action) { 
    if (wlname == null || wlname == undefined || wlname.length == 0 || wlname == '') {
        return;
    } 

    var table_id = element_id.replace('select_', '').replace('add_', '').replace(/\s+/g, '');
    if (table_id !== null && table_id !== undefined) {
        showHideTableWatchlist(table_id);
        
        var pid_selected = document.querySelector("#profile li.profile-selected-li");
        var pid = pid_selected.getAttribute("data-value");
        localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_selected', wlname);
        var name = wlname;
        var url = '/shared/viewwatchlist/';
        var table_tag = document.getElementById(table_id);
        if (table_tag !== null && table_tag !== undefined) {
            var table = table_tag.getElementsByTagName('tbody')[0];
        }
        var start = 1; // Starting index of the data to fetch
        var pageSize = 31; // Number of rows to fetch per request

        $("#" + table_id + " tbody tr").remove();

        // deepcode ignore FunctionDeclarationInBlock: <please specify a reason of ignoring this>
        function appendRow(data) {
            data.watchlist_results.forEach(function(wl_data){
                symbol = wl_data.symbol;
                board = wl_data.board;
                symbol_board = symbol.replace(/[^a-zA-Z ]/g, '') + board;
                symbol_dot_board = wl_data['symbol']+'.'+wl_data['board'];

                change = wl_data.ltp_change == 0 ? '0.00' : wl_data.ltp_change;
                changeper = wl_data.ltp_changeper == 0 ? '0.00' : wl_data.ltp_changeper;
                high = wl_data.high == 0 ? '-' : wl_data.high;
                low = wl_data.low == 0 ? '-' : wl_data.low;
                vol = wl_data.total_qty == 0 ? '-' : Number(wl_data.total_qty).toLocaleString("en-IN");
                trade = wl_data.total_trades == 0 ? '-' : wl_data.total_trades;
                value = wl_data.total_value == 0 ? '-' : Number(wl_data.total_value).toLocaleString("en-IN");
                ltp = wl_data.ltp == 0 ? '-' : wl_data.ltp;
                cp = wl_data.close_price == 0 ? '-' : wl_data.close_price;
                ycp = wl_data.ycp == 0 ? '-' : wl_data.ycp;
                yvol = wl_data.yvol == 0 ? '-' : Number(wl_data.yvol).toLocaleString("en-IN");

                bidq = wl_data.bid_qty == 0 ? '-' : wl_data.bid_qty;
                askq = wl_data.ask_qty == 0 ? '-' : wl_data.ask_qty;
                bidp = wl_data.bid_price == 0 ? '-' : wl_data.bid_price;
                askp = wl_data.ask_price == 0 ? '-' : wl_data.ask_price;
                // symname = wl_data.result[i].replace(".", "");

                pos_neg = '';
                color_class = '';
                bg_class = '';

                if (wl_data.ltp_change > 0) {
                    color_class = 'up';
                    pos_neg = '+';
                    bg_class = 'positive';
                }
                if (wl_data.ltp_change < 0) {
                    color_class = 'down';
                    pos_neg = '';
                    bg_class = 'negative';
                }
                if (wl_data.ltp_change == 0) {
                    color_class = 'neutral';
                    pos_neg = '';
                    bg_class = 'nochange';
                }
                
                suspend = 'neutral';
                if (wl_data.suspend == true) {
                    suspend = 'down';
                }

                row = table.insertRow();
                row.classList.add("watchlist_ticker")
                row.setAttribute("onclick", "watchlist_link(this)");
                row.setAttribute("data-id", symbol_dot_board);
                row.style.textAlign = 'center';

                row.innerHTML = `
                <td class="${table_id}-col-1 sortme">
                    <div data-symbol="${symbol_dot_board}" class="tab-border-left td-btn">
                        <button onclick="remove_from_watchlist('${symbol_dot_board}', '${table_id}')" class="wlremove has-tooltip" title="Remove Stock"><i class="fa fa-times"></i>
                        </button>
                    </div>
                </td>
                <td class="${table_id}-col-2 sortme">
                  <div align="left" data-symbol="${symbol_dot_board}" class="ticker_name ${suspend}">${symbol}</div>
                </td>
                <td class="${table_id}-col-3 sortme">
                  <div class="tab-border-left">${wl_data.symbol_category}</div>
                </td>
                <td class="${table_id}-col-4 sortme ui-sortable-handle">
                  <div class="${symbol_board}_ltp ${color_class} tab-border-left">${ltp}</div>
                </td>
                <td class="${table_id}-col-5 sortme ui-sortable-handle">
                    <div class="${symbol_board}_close tab-border-left">${cp}</div>
                </td>
                <td class="${table_id}-col-6 sortme ui-sortable-handle">
                  <div class="${symbol_board}_bidq tab-border-left watch_bid_bg">${bidq}</div>
                </td>
                <td class="${table_id}-col-7 sortme ui-sortable-handle">
                  <div class="${symbol_board}_bid tab-border-left watch_bid_bg">${bidp}</div>
                </td>
                <td class="${table_id}-col-8 sortme ui-sortable-handle">
                  <div class="${symbol_board}_ask tab-border-left watch_ask_bg">${askp}</div>
                </td>
                <td class="${table_id}-col-9 sortme ui-sortable-handle">
                  <div class="${symbol_board}_askq tab-border-left watch_ask_bg">${askq}</div>
                </td>
                <td class="${table_id}-col-10 sortme ui-sortable-handle">
                  <div class="${symbol_board}_high tab-border-left">${high}</div>
                </td>
                <td class="${table_id}-col-11 sortme ui-sortable-handle">
                  <div class="${symbol_board}_low tab-border-left">${low}</div>
                </td>
                <td class="${table_id}-col-12 sortme ui-sortable-handle">
                  <div class="${symbol_board}_vol tab-border-left">${vol}</div>
                </td>
                <td class="${table_id}-col-13 sortme ui-sortable-handle">
                  <div class="${symbol_board}_ycp tab-border-left">${ycp}</div>
                </td>
                <td class="${table_id}-col-14 sortme ui-sortable-handle">
                 <div class="${symbol_board}_yvol tab-border-left">${yvol}</div>
                </td>
                <td class="${table_id}-col-15 sortme ui-sortable-handle">
                 <div class="${symbol_board}_chg ${color_class} tab-border-left">${pos_neg}${change}</div>
                </td>
                <td class="${table_id}-col-16 sortme ui-sortable-handle">
                 <div class="${symbol_board}_chgper ${color_class} tab-border-left">${pos_neg}${changeper}%</div>
                </td>
            `;

                // var headers = document.getElementById(table_id)?.getElementsByTagName("th");
                // var cellData = [
                //     `<div data-symbol="${symbol_dot_board}" class="tab-border-left td-btn"><button onclick="remove_from_watchlist('${symbol_dot_board}', '${table_id}')" class="wlremove has-tooltip" title="Remove Stock"><i class="fa fa-times"></i></button></div>`,
                //     `<div align="left" data-symbol="${symbol_dot_board}" class="ticker_name ${suspend}">${symbol}</div>`,
                //     `<div class="tab-border-left">${wl_data.symbol_category}</div>`,

                //     `<div class="${symbol_board}_ltp ${color_class} tab-border-left">${ltp}</div>`,

                //     `<div class="${symbol_board}_close tab-border-left">${cp}</div>`,
                //     `<div class="${symbol_board}_bidq tab-border-left watch_bid_bg">${bidq}</div>`,
                //     `<div class="${symbol_board}_bid tab-border-left watch_bid_bg">${bidp}</div>`,

                //     `<div class="${symbol_board}_ask tab-border-left watch_ask_bg">${askp}</div>`,
                //     `<div class="${symbol_board}_askq tab-border-left watch_ask_bg">${askq}</div>`,

                //     `<div class="${symbol_board}_high tab-border-left">${high}</div>`,
                //     `<div class="${symbol_board}_low tab-border-left">${low}</div>`,

                //     `<div class="${symbol_board}_vol tab-border-left">${vol}</div>`,

                //     `<div class="${symbol_board}_ycp tab-border-left">${ycp}</div>`,
                //     `<div class="${symbol_board}_yvol tab-border-left">${yvol}</div>`,

                //     `<div class="${symbol_board}_chg ${color_class} tab-border-left">${pos_neg}${change}</div>`,
                //     `<div class="${symbol_board}_chgper ${color_class} tab-border-left">${pos_neg}${changeper}%</div>`
                // ];

                // cellData.forEach((html, index) => insertCellWithClass(index, html, headers));
            })
             // Enable Table Sorting
             Sortable.initTable(table_tag);  
            
            // if(!ignorewatchlist.includes(wlname)) {
            //     $("#" + table_id + " tbody").sortable({
            //         cursor: "move",
            //         placeholder: "sortable-placeholder",
            //         helper: function (e, tr) {
            //             var $originals = tr.children();
            //             var $helper = tr.clone();
            //             $helper.children().each(function (index) {
            //                 // Set helper cell sizes to match the original sizes
            //                 $(this).width($originals.eq(index).width());
            //             });
            //             return $helper;
            //         },
            //         stop: function (event, ui) { 
            //             // Save the new order after dragging and dropping
            //             saveRowOrder();
            //         }
            //     }).disableSelection();
            // }

            if(action == 'add_watchlist' || action == 'remove_watchlist'){
                tableStateSave(table_id);
              }
  
             function moveColumn(table, sourceIndex, targetIndex) {
                  var body = $("tbody", table);
                  $("tr", body).each(function (i, row) {
                      if (sourceIndex < targetIndex) {
                          // Dragging from left to right
                          $("td", row).eq(sourceIndex).insertAfter($("td", row).eq(targetIndex));
                      } else {
                          // Dragging from right to left
                          $("td", row).eq(sourceIndex).insertBefore($("td", row).eq(targetIndex));
                      }
                  });
              }
  
               //  Drag and drop action for column
               $("#" + table_id + ">" + "thead" + ">" + "tr").sortable({
                  items: "> th.sortme:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(3))",
                  start: function(event, ui) {
                    ui.item.data("source", ui.item.index());
                    ui.placeholder.html(ui.item.html());
                  },
                  update: function(event, ui) {
                    moveColumn($(this).closest("table"), ui.item.data("source"), ui.item.index());
                    $("#" + table_id + ">" + "tbody").sortable("refresh"); 
                    // Save the table state after the update
                    tableStateSave(table_id);
                  }, 
                  placeholder: "ui-state-highlight"
               });
  
               //  Drag and drop action for row
               $("#" + table_id + " tbody").sortable({
                  cursor: "move",
                  placeholder: "sortable-placeholder",
                  helper: function (e, tr) {
                      var $originals = tr.children();
                      var $helper = tr.clone();
                      $helper.children().each(function (index) { 
                          $(this).width($originals.eq(index).width());
                      });
                      return $helper;
                  },
                  start: function (event, ui) {
                      // Add shadow effect to the dragged table row
                      ui.helper.addClass("dragging-shadow");
                  },
                  stop: function (event, ui) {  
                      // Save the table state after the update
                      tableStateSave(table_id);
                  }
              })
  
              $("#" + table_id).resizableColumns({
                  store: window.store,
                  minWidth: 15
                  // resize: onResize
              });
  
              // Bind to the mouseup event on resizable columns
              $("#" + table_id + ">" + "thead" + ">" + "tr > th.sortme").on('mouseup', function () {
                  tableStateSave(table_id);
              });
        }  

        // var insertCellWithClass = (index, text, headers) => {
        //     var cell = row.insertCell(index);
        //     if (headers[index] !== null && headers[index] !== undefined && headers[index].className !== undefined && headers[index].className !== '') {
        //         cell.classList.add(headers[index].className);
        //         cell.innerHTML = text;
        //     } else {
        //         cell.innerHTML = text;
        //     }
        // };  

        // deepcode ignore FunctionDeclarationInBlock: <please specify a reason of ignoring this>
        function fetchData() {
            // Create a new AbortController for the latest request
            var controller = new AbortController();
            fetchController = controller

            $.ajax({
                url: url,
                data: {
                    name: name,
                    start: start,
                    pageSize: pageSize
                },
                dataType: 'json',
                method: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('AbortController', controller.signal);
                },
                success: function (data) {
                    appendRow(data);
                    tableStateLoad()
                    // if(!ignorewatchlist.includes(wlname)) {
                    // // Save the order after loading the data
                    // // saveRowOrder(); 
                    // }
                    if (data.watchlist_results.length === pageSize) { 
                        // If there are more rows available, increment the start index
                        start += 1;
                        fetchData();
                    } else { 
                        // All rows have been loaded
                        hideShowTableColWatchlistFromLocal(table_id);
                    }
                    
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    // Check if the request was cancelled
                    if (textStatus !== 'abort') {
                        // Handle the error
                        console.log('Error:', errorThrown);
                    }
                }
            });
        }

        //deepcode ignore FunctionDeclarationInBlock: <please specify a reason for ignoring this>
        // function saveRowOrder() {
        //     var dragTr = $("#" + table_id + " tbody").sortable("toArray", { attribute: "data-id" });  
        //     // localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_' + wlname, JSON.stringify(dragTr));
           
        //     var apiUrl = '/shared/addwatchlistitemprecedence/';
        //     // Make a POST request to the Flask API
        //     $.ajax({
        //         type: 'POST',
        //         url: apiUrl,
        //         contentType: 'application/json',
        //         data: JSON.stringify({ wlname: wlname, dragTr: dragTr }),
        //         success: function (data) {
        //             // show_flash_messages(data, 'success');
        //         },
        //         error: function (data) {
        //             console.log(data.responseText);
        //             // show_flash_messages(data.responseText, 'danger');
        //         }
        //     });
        // }
 

          //deepcode ignore FunctionDeclarationInBlock: <please specify a reason for ignoring this>
          function tableStateSave(table_id) {
            var headerOrder = [];
            var columnWidths = [];

            $("#" + table_id + ">" + "thead" + ">" + "tr > th.sortme").each(function () {
                headerOrder.push($(this).text().trim());
                columnWidths.push($(this).width());
            });

            localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_' + wlname + '_header', JSON.stringify(headerOrder));
            localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_' + wlname + '_widths', JSON.stringify(columnWidths));

            var dragTable = $("#" + table_id + ">" + "tbody").html();
            localStorage.setItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_' + wlname, JSON.stringify(dragTable));
        }

        // deepcode ignore FunctionDeclarationInBlock: <please specify a reason of ignoring this>
        function tableStateLoad() {
            var headerOrder = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_' + wlname + '_header'); 
            let headers = document.getElementById(table_id).getElementsByTagName("th"); 
            if (headerOrder) {
                headerOrder = JSON.parse(headerOrder);
                var table = document.getElementById(table_id);
                var headerRow = table.tHead.getElementsByTagName("tr")[0];
                headerOrder.forEach(function (text, index) {
                    var th = Array.from(headers).find(header => header.innerHTML === text);
                    if (th) {
                        headerRow.appendChild(th);
                        // Set the loaded column width
                        localStorage.removeItem('undefined-undefined')
                        $(th).width(JSON.parse(localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_' + wlname + '_widths'))[index]);
                    }
                });
            }

            var dropTable = localStorage.getItem(system_username + '_layout_' + profile_page + '_' + pid + '_' + table_id + '_' + wlname); 
            if (dropTable) { 
                dropTable = JSON.parse(dropTable);
                $("#" + table_id + ">" + "tbody").html(dropTable);
            }
        } 


        // Cancel the ongoing request if exists
        if (fetchController) {
            fetchController.abort();
        }

        if (wlname != undefined && wlname != "") {
            fetchData();
        } 

    }
}

document.addEventListener('click', function (event) {
    var clickedElement = event.target;
    var tables = document.querySelectorAll('.watchlist_table');

    // Check if the clicked element or its parent is part of the table
    var isPartOfTable = false;
    for (var table of tables) {
        if (table.contains(clickedElement)) {
            isPartOfTable = true;
            break;
        }
    }

    if (!isPartOfTable) {
        var rows = document.querySelectorAll('.watchlist_ticker');
        for (var row of rows) {
            row.classList.remove('clicked');
        }
    }
});


function watchlist_link(elem) {
    let rows = document.querySelectorAll('.watchlist_ticker');
    let pid_selected = document.querySelector("#profile li.profile-selected-li");
    let pid = pid_selected.getAttribute("data-value");
    for (var otherRow of rows) {
        otherRow.classList.remove('clicked');
    }
    elem.classList.add('clicked');
    
    let watchlist_header = $(elem).parents().parents().parents().parents().parents().parents().parents().children().eq(0);
    let watchlist_header_text = watchlist_header.children().eq(0).find('.lm_active').children().eq(1).text();
    let watchlist_color = localStorage.getItem(system_username + '_' + profile_page + '_' + pid + '_' + watchlist_header_text +'_color');

    
    let Quote_color = localStorage.getItem(system_username + '_' + profile_page + '_' + pid + '_' + 'Quote_color'); 
    let Chart_color = localStorage.getItem(system_username + '_' + profile_page + '_' + pid + '_' + 'Chart_color'); 
    let News_color = localStorage.getItem(system_username + '_' + profile_page + '_' + pid + '_' + 'News_color'); 
    let stockInfo_color = localStorage.getItem(system_username + '_' + profile_page + '_' + pid + '_' + 'Stock Info_color'); 

    let symbol = $(elem).find('.ticker_name').text().trim();
    let symbol_board = $(elem).find('.ticker_name').data('symbol'); 
    let board = symbol_board.split('.')[1];
    chart_board = board;

    let exist_widget_watch = $('.lm_title'); 
    let mktdpt_watch_colors = [];
    
    for (var i = 0; i < exist_widget_watch.length; i++){
        let title_text_watch = $(exist_widget_watch[i]).text();  
        if (title_text_watch.includes('Market Depth')){  
             
            let watch_words = title_text_watch.split(' '); 
            let part3_watch = watch_words[2]; 
            
            let colorObject_watch = {
                key: part3_watch,
                value: localStorage.getItem(system_username + '_' + profile_page + '_' + pid + '_' + title_text_watch + '_color')
            };
            mktdpt_watch_colors.push(colorObject_watch);
        }
    } 
 
    // Iterate through the array and access key and value
    mktdpt_watch_colors.forEach(item => {
        let watch_mktdpt_key = item.key;
        let watch_mktdpt_color = item.value; 
          
        if (watchlist_color == watch_mktdpt_color) {
            let watch_mktdpt_input_id = 'symbol_mktdpt_table_' + watch_mktdpt_key; 
            let target_title_watch_mkt = $('#' + watch_mktdpt_input_id).parents().parents().parents().parents().parents().parents().children().eq(0).find('.lm_active').children().eq(1).text(); 
            let watch_mkt_channel_array= []; 
            let watch_mkt_channel_object = {
                symbol_id: watch_mktdpt_input_id,
                mkt_symbol: symbol_board
            };
    
            watch_mkt_channel_array.push(watch_mkt_channel_object)
            if ($('.mktdpt_symbol_name').length > 0) { 
                localStorage.setItem(system_username +'_mkt' + target_title_watch_mkt, JSON.stringify(watch_mkt_channel_array));
                let current_mkt_symbol =  $('#' + watch_mktdpt_input_id).val();
                if(symbol_board != current_mkt_symbol)
                {
                    $('#' + watch_mktdpt_input_id).val(symbol_board);
                    getmktdepth(symbol_board, watch_mktdpt_input_id);
                }
               
            }  
        }
    });
 

    if(watchlist_color == Quote_color){
        if ($('#quote_box').length > 0) { 
            let current_quote_symbol = $('#quote_loaded_symbol').text();
            if(symbol_board != current_quote_symbol)
            {
                get_quote_data(symbol_board);
            } 
        }
    }

    if(watchlist_color == Chart_color) {
        if (($('#tv_chart_container').length > 0 || $('#tv_chart_container_advanced').length > 0) && window.symbol_advanced_chart_widget) { 
            let current_chart_symbol =  window.symbol_advanced_chart_widget.activeChart().symbol();
            if(symbol_board != current_chart_symbol)
            {
                reinit_chart(symbol_board); 
            }
        }
   }
 
    if(watchlist_color == News_color){
        if ($('#symbol-news-content').length > 0) {
            if ($('#symbol-news-content').is(":visible")){
                let current_news_symbol = $('#current_news_symbol').text(); 
                if(symbol != current_news_symbol){
                    sym_news(symbol);
                }  
            };
        }
    }

    if(watchlist_color == stockInfo_color){
        if ($('#stock_analysis').length > 0) {
            getAndSetFinancialData(symbol);
            getAndSetHoldingsData(symbol);
            getAndSetProfileData(symbol);
            getAndSetCorpActionsData(symbol);
            getAndSetNewsData(symbol);
        }
    }

    if ($('.timesale_symbol_name').length > 0){        
        $('.timesale_symbol_name').eq(0).val(symbol_board);
        if(timesalewindow != undefined){            
            $('.web-time-sales-table tbody tr').remove();
            gettimesale(symbol_board, $('.timesale_symbol_name').eq(0).attr("id"));        
        }
    }
    if (board == 'YIELDDBT') {
        getGsecData(symbol);
    }
};

// Add symbol to watchlist
function add_to_watchlist(instrument, element_id) {
    var table_id = element_id.replace('add_', '');
    if (instrument != null) {
        var name = $('#select_' + table_id).val();
        if (name != null && name != '' && !ignorewatchlist.includes(name)) {
            var url = '/shared/addwatchlistitem/';
            $.get(url, { symbol: instrument, name: name })
                .done(function (data) {
                    show_flash_messages(data, 'success');
                    load_watchlist(name, table_id,'add_watchlist');
                })
                .fail(function (data) {
                    show_flash_messages(data.responseText, 'danger');
                });
        } else {
            show_flash_messages('Please select a watchlist', 'danger');
        }
    }
}

// Remove symbol from watchlist
function remove_from_watchlist(instrument, table_id) {
    if (instrument != null) {
        var name = $('#select_' + table_id).val();
        var url = '/shared/removewatchlistitem/';
        $.get(url, { symbol: instrument, name: name })
            .done(function (data) {
                show_flash_messages(data, 'success');
                load_watchlist(name, table_id,'remove_watchlist');
            })
            .fail(function (data) {
                show_flash_messages(data.responseText, 'danger');
            });

    }
}


//Hide and Show From Local
function hideShowTableColWatchlistFromLocal(table_id) {
    var storedColumnNames = JSON.parse(localStorage.getItem(system_username + '_' + table_id)) || [];
    var wl_class = "." + table_id + "-col-checkbox";
    var colCheckboxes = document.querySelectorAll(wl_class);

    colCheckboxes.forEach((element) => {
        var colName = element.getAttribute("data-col");
        if (storedColumnNames.includes(element.value)) {
            var isChecked = element.checked = false
            hideShowTableColWatchlist(colName, isChecked)
        }
    });
}

//Hide and Show functionality
function hideShowTableColWatchlist(colName, checked) {
    var cells = document.querySelectorAll(`.${colName}`);
    cells.forEach((cell) => {
        cell.style.display = checked ? "table-cell" : "none";
    });
}


function showHideTableWatchlist(table_id) {
    var tableId = document.getElementById(table_id);
    if (tableId !== null && tableId !== undefined) {
        // var thElements = tableId.getElementsByTagName('th');
        // for (let i = 0; i < thElements.length; i++) {
        //     var className = `${table_id}-col-${i + 1}`;
        //     thElements[i].className = className;
        // }

        var wl_class = "." + table_id + "-col-checkbox";
        var colCheckboxes = document.querySelectorAll(wl_class);
        colCheckboxes.forEach((element) => {

            element.addEventListener("change", (event) => {
                var columnNames = JSON.parse(localStorage.getItem(system_username + '_' + table_id)) || [];

                var colName = element.getAttribute("data-col");
                var checked = event.target.checked;

                if (checked) {
                    columnNames = columnNames.filter(
                        (columnName) => columnName !== element.value
                    );

                }

                else {
                    columnNames.push(element.value);
                }
                hideShowTableColWatchlist(colName, checked);
                localStorage.setItem(system_username + '_' + table_id, JSON.stringify(columnNames));
            });

        });

        hideShowTableColWatchlistFromLocal(table_id);
    }
}

//Context Menu for Watchlist
$.contextMenu({
    selector: '.watchlist_ticker', 
    autoHide: true,
    zIndex: 10000,
    callback: function(key, op) {
        // Call your existing context menu logic
        var order_symbol = op.$trigger.data('id');
        var last_selected_client_code = window.localStorage.getItem('last_selected_client_code');
        switch(key){
            case "buy": 
                if(last_selected_client_code) {

                    $('#order_client_code').val(last_selected_client_code);
                }
                else {
            
                    $('#order_client_code').focus();
                }
                $("#order_instrument").val(order_symbol).trigger('change'); 
                buy_window(); 
                break;
            case "sell": 
                if(last_selected_client_code) {

                    $('#order_client_code').val(last_selected_client_code);
                }
                else {
            
                    $('#order_client_code').focus();
                }
                $("#order_instrument").val(order_symbol).trigger('change'); 
                sell_window(); 
                break;
            case "timesale": time_sale_window(order_symbol); break;
            case "pricetable": showPriceTableWidget(order_symbol); break;
            case "setalert": 
                show_alert_window(order_symbol);
                break;
            case "chart": 
                showChart(order_symbol);
                break;
            case "info": showQuote(order_symbol); break;
            case "news":
                showNews(order_symbol);
                break;
            default: 
                None
        }

        // Call the handleTableClick function using the event property
        
    },
    items: {
        "buy": { name: "BUY", icon: "fa-arrow-up" },
        "sell": { name: "SELL", icon: "fa-arrow-down" },
        "timesale": { name: "Time & Sale", icon: "fa-clock-o" },
        "pricetable": { name: "Historical Volume", icon: "fa-database", className: "contextmenu-padding" },
        // "chart":{name: "Chart", icon: "fa-line-chart", className: "contextmenu-padding"},
        "info": { name: "Info", icon: "fa-info" },
        "news": { name: " News", icon: "fa-newspaper-o", className: "contextmenu-padding" },
        "setalert": {name: "Set Alert", icon: "fa-bell", className: "contextmenu-padding"},
    }
});

function shortenBoardName(board) {
    const mapping = {
        "SPUBLIC": "SPUB",
        "SBLOCK": "SBL",
        "BLOCK": "BL",
        "PUBLIC": "PB",
        "BUYDBT": "BDBT",
        "BUYIN": "BIN",
        "SBUYIN": "SBIN",
        "ATBPUB": "ATBPB",
        "ATBDEBT": "ATBDBT",
        "INDEX": "IDX",
        "YIELDDBT": "YDBT",
        "ATBBUYIN": "ATBBIN",
        "DEBT": "DBT",
        "SCPX": "SCPX"

    };

    // Use ternary operator to return the shortened board or the original board
    return mapping[board] || board;
}