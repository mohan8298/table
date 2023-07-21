// Class constructor for Pragma DataTable component.
// Implements Pragma component design pattern
//
// @constructor
// @param {HTMLElement} The element that will be upgraded to be Pragma DataTable.
var PragmaDataTable = function PragmaDataTable(element) {
    this.element_ = element;
    this.table_ = this.element_.querySelector('table');
    this.applyFilterArr = [];
    this.searchResults = [];
    this.searchElement_ = this.element_.querySelector('.' + this.constants_.TABLE_SEARCH)
    this.filterElement_ = this.element_.querySelectorAll('.' + this.constants_.TABLE_DROPDOWN)
    this.showFilter = this.element_.querySelector('.filter-icon');
    this.totalRows = this.table_.tBodies[0].rows.length
    this.columns = this.table_.tHead.querySelector('tr.'+this.constants_.TABLE_HEADERS).cells
    if (this.totalRows > 5) {
      for (var i = 0; i < this.columns.length; i++) {
        this.columns[i].addEventListener('click', this.sortTable(this.columns[i], i))
      }
    }
    // Checking here if author has Config pagination in table
    if ((this.element_.dataset.paginate === 'true') && (this.totalRows != 0)) {
      // if pagination is enabled
      // then the below function with execute.
      this.paginate()
    } else {
      this.perPageField = {
        value: this.totalRows
      }
    }
    // Checking here if author has Config searchable in table
    if(this.element_.dataset.searchable  === 'true'){
        this.searchElement_.addEventListener("keyup", function() { 
       this.searchRow(parseInt(this.constants_.DEFAULT_START),parseInt(this.perPageField.value));
      }.bind(this))
    }
    // Checking here if author has Config Filterable in table
    if(this.element_.dataset.filterable  === 'true'){
        for (var i = 0; i < this.filterElement_.length; i++) {
            this.filterElement_[i].addEventListener('mousedown', function (e) {
            e.preventDefault();
            this.FilterApply(e.target.closest('li'));
            this.searchRow(parseInt(this.constants_.DEFAULT_START), parseInt(this.perPageField.value));
          }.bind(this))
        //Added checkboxes for each value of filter group
        Array.prototype.slice.call(this.filterElement_[i].children).forEach(function (listItem,index) {
          if (index === 0) {
            var labelValue = listItem.closest('.dropdown').querySelector('.current');
            labelValue.innerHTML = listItem.innerHTML;
            var dropdownList = listItem.closest('.dropdown');
            dropdownList.addEventListener('click', function () {
                dropdownList.classList.toggle('open');
            });
          }
          if(index > 0 ) {
              var liValue = listItem.getAttribute('data-value');
              var liText = listItem.textContent;
              listItem.innerHTML=
              '<fieldset class=\'cmp-form-options cmp-form-options--checkbox\'>\
              <label class=\'cmp-form-options__field-label\'>' + liText +
              '<input class=\'cmp-form-options__field cmp-form-options__field--checkbox\'\
              name=\'Checkbox Item Demo\' value=\'' + liValue + '\' index=\'' + index + '\' type=\'checkbox\'>\
              <span class=\'cmp-form-options__field-description\'></span>\
              </label>\
          </fieldset>';
  
          }
        })
      }
      this.showFilter.addEventListener('click', function(){
        this.element_.querySelector('.table-filter').classList.toggle('d-none');
      }.bind(this))
    }
  };
  window['PragmaDataTable'] = PragmaDataTable
  
  /*
    * This function triggers the Filter function for Table component
    *
  */
  
  PragmaDataTable.prototype.FilterApply = function(li){
    const nodes = Array.from( li.closest('ul').children ); // get array
    const index = nodes.indexOf( li );
    if(index>0){
      if (!li.classList.contains('selected')) {
        li.classList.add('selected');
        li.getElementsByTagName('input')[0].checked = true;
          this.applyFilterArr.push(li.dataset.value);
      }else {
        li.classList.remove('selected');
        li.getElementsByTagName('input')[0].checked = false;
        this.applyFilterArr = this.applyFilterArr.filter(function(e){
          return e !== li.dataset.value
        })
      }
      this.ShowSelectedFilter();
    }
  }
  
  /*
    * This function handles the filters that are displayed based on the filter selction.
    *
  */
  
  PragmaDataTable.prototype.ShowSelectedFilter = function(){
    let FilterDiv = this.element_.querySelector('.filter-value');
    FilterDiv.innerHTML = '';
    this.applyFilterArr.forEach(function(value){
      let span = document.createElement('span')
      span.innerHTML = value;
      span.style.paddingRight = '10px';
      FilterDiv.append(span);
      span.addEventListener('click', (e)=> {
        for (var i = 0; i < this.filterElement_.length; i++) {
          const selectedIndex = Array.prototype.slice.call(this.filterElement_[i].getElementsByTagName('li')).findIndex((val)=> val.dataset && val.dataset.value === e.target.innerText);
          if(selectedIndex>0){
            this.FilterApply(this.filterElement_[i].getElementsByTagName('li')[selectedIndex]);
          }        
        }
        this.searchRow(parseInt(this.constants_.DEFAULT_START),parseInt(this.constants_.DEFAULT_PER_PAGE));
        e.target.remove();
      })
   
    }.bind(this))
    if (this.applyFilterArr.length > 0) {
      let span = document.createElement('span')
      span.className = "clear-all";
      span.innerHTML = "Clear all"
      FilterDiv.append(span);
      span.addEventListener('click', (e)=> {
        this.clearAllFilter(e);
      })
    }
  }
  
  /*
    * This function is used to clear all the selected filters 
    * from the filter group also from the bottom where we
    * are showing all the selected filters
  */
  
  PragmaDataTable.prototype.clearAllFilter =function(e){
    this.applyFilterArr = [];
    selectedAllFilter = this.element_.querySelectorAll('li.selected');
    for(let result of selectedAllFilter){
      this.FilterApply(result);
    }
    this.searchRow(parseInt(this.constants_.DEFAULT_START),parseInt(this.constants_.DEFAULT_PER_PAGE));
  }
  
   
  /*
    * This function handles the Search functionality for Table component
    *
  */
  PragmaDataTable.prototype.searchRow =function(start,end){
    var query = this.searchElement_.value.trim().toLowerCase();
    var rex = new RegExp(query, 'i');
    var rows= Array.prototype.slice.call(this.table_.tBodies[0].rows);
    let searchingEvent = componentHandler.createEvent(
      'searching.pragma.table',
      {
        'query': query
      },
      false,
      true)
    this.element_.dispatchEvent(searchingEvent);
    this.element_.classList.add(this.constants_.TABLE_LOADING);
    rows.forEach(function(row) {
      row.classList.add("d-none");
    });
    if (!query.includes(',')) {
      this.searchResults = rows.filter(function(row){
        var tester = rex.test(query?row.getAttribute("data-row-search"):row.getAttribute('data-row-filter'));
        tester = tester && this.filterRows(row);
        return tester;
      }.bind(this))
  
      this.showRow(this.searchResults,start,end);
    }
    let finalCount = 0;
    if (this.searchResults.length !== this.totalRows && this.searchResults.length <= this.totalRows) {
      finalCount = this.searchResults.length
    }else {
      finalCount = this.totalRows
      this.drawRows(start, end, this.perPageField.value, this.totalRows)
    }
    this.manageLinks(start, end, finalCount);
    let searchEvent = componentHandler.createEvent(
      'search.pragma.table',
      {
        'query': query
      },
      false,
      true)
     this.element_.dispatchEvent(searchEvent);
    if (this.element_.dataset.paginate  === 'true'){
      if (this.searchResults.length <= parseInt(this.perPageField.value)) {
        this.element_.querySelector("."+this.constants_.PAGINATION_ROW).classList.add("d-none")
      }else{
        this.element_.querySelector("."+this.constants_.PAGINATION_ROW).classList.remove("d-none")
      }
    }
    this.element_.classList.remove(this.constants_.TABLE_LOADING);
  }
  
  /*
    * This function is used for showing the result 
    * Based on the search
  */
  PragmaDataTable.prototype.showRow = function(rows,start,end){
    rows.slice(start,end).forEach(function(row){
      row.classList.remove("d-none");
    })
  } 
  
  
  /*
    * In This function we are checking both searchable and filterable 
    * data based on selection.
  */
  PragmaDataTable.prototype.filterRows = function(row){
    var rowFilter =  row.getAttribute('data-row-filter')||[];
    var status= this.applyFilterArr.length>0? this.applyFilterArr.some(function(applyFilter){
      return rowFilter.includes(applyFilter);
    }):true;
  return status;
  }
  
  // Store strings for class names defined by this component that are used in
  // Javascript. This allows us to simply change it in one place should we decide
  // to modify at a later date.
  //
  // @enum {string}
  // @private
  PragmaDataTable.prototype.constants_ = {
    TABLE_SEARCH: 'table-search .search-field',
    TABLE_FILTER: 'table-filter .select-filter',
    TABLE_DROPDOWN: 'table-filter ul',
    TABLE_HEADERS: 'table-headers',
    TABLE_LOADING: 'table-loading',
    ASC_SORTED: 'sorted-asc',
    DESC_SORTED: 'sorted-desc',
    DATATYPES: {
      DEFAULT: 'string',
      NUMBER: 'number',
      DATE: 'date'
    },
    DEFAULT_PER_PAGE: 15,
    PER_PAGE_OPTIONS: [15, 30, 45],
    DEFAULT_START: 0,
    PREV: 'prev',
    NEXT: 'next',
    PAGINATION_ROW: 'pagination-row',
    FOOTER_STRUCTURE:
     `<td colspan="">
              <div class="pagination-container">
                  <span class="pagination-per-page">Items per page: 
                      <select name="per-page" class="pagination-per-page-value">
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="45">45</option>
                      </select>
            <span class="pagination-range"></span>
                  </span>
                  <span class="pagination-description">
                      <span class="pagination-link">
                          <button class="icon-button prev"><</button>
              <span class="page-num"></span>
                          <button class="icon-button next" data-start="" data-end="">></button>
                      </span>
                  </span>
              </div>
          </td>`,
      SEARCH_RESULTS_ACTIVE: 'search-results-active',
      SEARCH_RESULT_ITEM: 'search-result-item',
  };
  
  // Sort Table
  //
  // @param {HTMLElement} The column that will be sorted.
  // @param {integer} The column number that will be sorted.
  // @public
  PragmaDataTable.prototype.sortTable = function (column, index) {
    if (column.dataset.sortable != 'false') {
      return function () {
        this.element_.classList.add(this.constants_.TABLE_LOADING)
        if (column.classList.contains(this.constants_.ASC_SORTED)) {
          let sortEvent = componentHandler.createEvent(
           'sorting.pragma.table',
           {
             'column': column.innerText,
             'order': 'des'
           },
           false,
           true)
          this.element_.dispatchEvent(sortEvent)
          this.sortColumnDesc(column, index)
        } else {
          let sortEvent = componentHandler.createEvent(
           'sorting.pragma.table',
           {
             'column': column.innerText,
             'order': 'asc'
           },
           false,
           true)
          this.element_.dispatchEvent(sortEvent)
          this.sortColumnAsc(column, index)
        }
        this.element_.classList.remove(this.constants_.TABLE_LOADING)
      }.bind(this)
    }
  };
  PragmaDataTable.prototype['sortTable'] = PragmaDataTable.prototype.sortTable;
  
  // Ascending Column Sort
  //
  // @param {HTMLElement} The column that will be sorted.
  // @param {integer} The column number that will be sorted.
  // @public
  PragmaDataTable.prototype.sortColumnAsc = function (column, index) {
    column.classList.remove(this.constants_.DESC_SORTED)
    column.classList.add(this.constants_.ASC_SORTED)
    let rows = this.table_.tBodies[0].rows
    let changed = false
    for (var i = 0; i < (rows.length - 1); i++) {
      let currentRow = rows[i]
      let nextRow = rows[i + 1]
      let currentValue = currentRow.cells[index].textContent.toLowerCase()
      let nextValue = nextRow.cells[index].textContent.toLowerCase()
      switch (column.dataset.type) {
        case(this.constants_.DATATYPES.NUMBER):
          currentValue = parseFloat(currentValue)
          nextValue = parseFloat(nextValue)
          break;
        case(this.constants_.DATATYPES.DATE):
          break;
      }
      if (currentValue > nextValue) {
        currentRow.parentNode.insertBefore(nextRow, currentRow)
        changed = true
      }
    }
    if (changed) this.sortColumnAsc(column, index);
    this.tableRowHandler(this.constants_.DEFAULT_START,(parseInt(this.constants_.DEFAULT_START) + parseInt(this.perPageField.value)));
    this.element_.dispatchEvent(
     componentHandler.createEvent(
      'sorted.pragma.table',
      {
        'column': column.innerText,
        'order': 'asc'
      },
      false,
      true)
    )
  }
  PragmaDataTable.prototype['sortColumnAsc'] = PragmaDataTable.prototype.sortColumnAsc;
  
  // Descending Column Sort
  //
  // @param {HTMLElement} The column that will be sorted.
  // @param {integer} The column number that will be sorted.
  // @public
  PragmaDataTable.prototype.sortColumnDesc = function (column, index) {
    column.classList.remove(this.constants_.ASC_SORTED)
    column.classList.add(this.constants_.DESC_SORTED)
    let rows = this.table_.tBodies[0].rows
    let changed = false
    for (var i = 0; i < (rows.length - 1); i++) {
      let currentRow = rows[i]
      let nextRow = rows[i + 1]
      let currentValue = currentRow.cells[index].textContent.toLowerCase()
      let nextValue = nextRow.cells[index].textContent.toLowerCase()
      switch (column.dataset.type) {
        case(this.constants_.DATATYPES.NUMBER):
          currentValue = parseFloat(currentValue)
          nextValue = parseFloat(nextValue)
          break;
        case(this.constants_.DATATYPES.DATE):
          break;
      }
      if (currentValue < nextValue) {
        currentRow.parentNode.insertBefore(nextRow, currentRow)
        changed = true
      }
    }
    if (changed) this.sortColumnDesc(column, index);
    this.tableRowHandler(this.constants_.DEFAULT_START,(parseInt(this.constants_.DEFAULT_START) + parseInt(this.perPageField.value)));
    this.element_.dispatchEvent(
     componentHandler.createEvent(
      'sorted.pragma.table',
      {
        'column': column.innerText,
        'order': 'asc'
      },
      false,
      true)
    )
  }
  PragmaDataTable.prototype['sortColumnDesc'] = PragmaDataTable.prototype.sortColumnDesc;
  
  // Paginate
  //
  // @public
  PragmaDataTable.prototype.paginate = function () {
    
    let footer = this.element_.querySelector('tfoot') || document.createElement('tfoot');
    let tr = document.createElement('tr');
    tr.classList.add(this.constants_.PAGINATION_ROW);
    tr.innerHTML = this.constants_.FOOTER_STRUCTURE
    footer.append(tr);
    this.table_.append(footer);
    this.element_.querySelector('tr.pagination-row td').setAttribute("colspan", this.columns.length);
    this.perPageField = this.element_.querySelector('.pagination-per-page-value');
    this.perPageField.value = this.element_.dataset.paginatePerPage || this.constants_.DEFAULT_PER_PAGE
    let range = footer.querySelector('.pagination-range');
    range.innerText = ' of ' + this.totalRows
  
    this.nextLink = footer.querySelector('.next');
    this.nextLink.addEventListener('click', this.changePage(this.constants_.NEXT));
    this.prevLink = footer.querySelector('.prev');
    this.prevLink.addEventListener('click', this.changePage(this.constants_.PREV));
  
    this.manageLinks(this.constants_.DEFAULT_START, (this.constants_.DEFAULT_START + parseInt(this.perPageField.value)), this.totalRows);
    this.drawRows(this.constants_.DEFAULT_START, (this.constants_.DEFAULT_START + parseInt(this.perPageField.value)), this.perPageField.value, this.totalRows);
  
    this.perPageField.addEventListener('change', this.changePerPage.bind(this));
    if (this.totalRows <= parseInt(this.perPageField.value)) {
      this.element_.querySelector("."+this.constants_.PAGINATION_ROW).classList.add("d-none");
    }
  }
  
  // Change Page
  //
  // @param {string} Change page direction ['prev', 'next']
  // @public
  PragmaDataTable.prototype.changePage = function (direction) {
    return function () {
      switch (direction) {
        case (this.constants_.PREV):
          this.element_.dispatchEvent(
           componentHandler.createEvent(
            'changingPage.pragma.table',
            {
              'start': this.prevLink.dataset.start,
              'end': this.prevLink.dataset.end,
              direction: this.constants_.PREV,
            },
            false,
            true)
          )
          this.tableRowHandler(parseInt(this.prevLink.dataset.start),parseInt(this.prevLink.dataset.end));
          this.element_.dispatchEvent(
           componentHandler.createEvent(
            'changePage.pragma.table',
            {
              'start': this.prevLink.dataset.start,
              'end': this.prevLink.dataset.end,
              direction: this.constants_.PREV,
            },
            false,
            true)
          )
          break;
        case (this.constants_.NEXT):
          this.element_.dispatchEvent(
           componentHandler.createEvent(
            'changingPage.pragma.table',
            {
              'start': this.nextLink.dataset.start,
              'end': this.nextLink.dataset.end,
              direction: this.constants_.NEXT,
            },
            false,
            true)
          )
          this.tableRowHandler(parseInt(this.nextLink.dataset.start),parseInt(this.nextLink.dataset.end));
          this.element_.dispatchEvent(
           componentHandler.createEvent(
            'changePage.pragma.table',
            {
              'start': this.nextLink.dataset.start,
              'end': this.nextLink.dataset.end,
              direction: this.constants_.NEXT,
            },
            false,
            true)
          )
          break;
      }
    }.bind(this)
  }
  
  // Manage Links
  //
  // @param {integer} start index for the table rows to be displayed
  // @param {integer} end index for the table rows to be displayed
  // @param {integer} total table rows
  // @public
  PragmaDataTable.prototype.manageLinks = function (start, end, totalRows) {
    if (this.element_.dataset.paginate === 'false') return;
    let range = this.element_.querySelector('.pagination-range')
    range.innerText = ' of ' + totalRows
    this.getPaginationNumbers(totalRows);
    if (end < totalRows) {
      this.nextLink.dataset.start = end
      if ((end + parseInt(this.perPageField.value)) < totalRows) {
        this.nextLink.dataset.end = end + parseInt(this.perPageField.value)
      } else {
        this.nextLink.dataset.end = totalRows
      }
      this.nextLink.disabled = false
    } else {
      this.nextLink.disabled = true
    }
    if (start > this.constants_.DEFAULT_START) {
      this.prevLink.dataset.start = start - parseInt(this.perPageField.value)
      this.prevLink.dataset.end = start
      this.prevLink.disabled = false
    } else {
      this.prevLink.disabled = true
    }
    if(totalRows) {
      const currentPage = Math.ceil(end/parseInt(this.perPageField.value));
      // Adding the active class to currentpage
      this.element_.querySelector(`[page-index='${currentPage}']`).classList.add('active');
    }
  }
  
  /*
    * This function is used to display the page number
    * 
  */
  PragmaDataTable.prototype.getPaginationNumbers = function(totalRows){
    const totalPages = Math.ceil(totalRows / this.perPageField.value);
     this.clearPaginationNumber();
    for (let i = 1; i <= totalPages; i++) {
      this.appendPageNumber(i);
    }
  };
  
  /*
    * This function is used to clear the innerHtml of 
    * page-num element
  */
  PragmaDataTable.prototype.clearPaginationNumber = function(){
    this.element_.querySelector('.page-num').innerHTML='';
  }
  
  /*
    * This function is used for appending the page count
    * when we change the value from the page
  */
  PragmaDataTable.prototype.appendPageNumber = function(index){
    let pageNum=this.element_.querySelector('.page-num');
    const pageNumber = document.createElement("button");
    pageNumber.className = "pagination-number";
    pageNumber.innerHTML = index;
    pageNumber.setAttribute("page-index", index);
    pageNumber.setAttribute("aria-label", "Page " + index);
    pageNum.appendChild(pageNumber);
    pageNumber.addEventListener("click", function(){
      this.setCurrentPage(index);
    }.bind(this));
    this.element_.dispatchEvent(componentHandler.createEvent('currentPage.pragma.table', index, false, true));
  }
  
  /*
    * This function is used set the current page value
  */
  PragmaDataTable.prototype.setCurrentPage = function(pageNum){
    const prevRange = (pageNum - 1) * this.perPageField.value;
    const currRange = pageNum * this.perPageField.value;
    if(this.searchResults.length>0){
      return this.searchRow(prevRange,currRange)
    }
    this.drawRows(prevRange,currRange,this.perPageField.value,this.totalRows)
    this.manageLinks(prevRange, currRange, this.totalRows);
  }
  
  
  
  // Draw Rows
  //
  // @param {integer} start index for the table rows to be displayed
  // @param {integer} end index for the table rows to be displayed
  // @param {integer} per page display for the table
  // @param {integer} total table rows
  // @public
  PragmaDataTable.prototype.drawRows = function (start, end, per_page = this.constants_.DEFAULT_PER_PAGE, totalRows) {
    if (start > totalRows) throw new Error('Invalid argument provided to draw Pragma Data Table. Requested pagination range out of scope.');
    for (let i = 0; i < start; i++) {
      this.table_.tBodies[0].rows[i].classList.add('d-none')
    }
    for (let i = start; i < end; i++) {
      this.table_.tBodies[0].rows[i] !== undefined ? this.table_.tBodies[0].rows[i].classList.remove('d-none') : ''
    }
    for (let i = end; i < totalRows; i++) {
      this.table_.tBodies[0].rows[i].classList.add('d-none')
    }
  }
  
  // Change Per Page
  //
  // @param {integer} rows to display per page
  // @public
  PragmaDataTable.prototype.changePerPage = function () {
    this.element_.dispatchEvent(
     componentHandler.createEvent('changingPerPage.pragma.table', null, false, true)
    )
    let range = this.element_.querySelector('.pagination-range')
    range.innerText = ' of ' + this.totalRows
    this.tableRowHandler(this.constants_.DEFAULT_START,(parseInt(this.constants_.DEFAULT_START) + parseInt(this.perPageField.value)));
    this.element_.dispatchEvent(
     componentHandler.createEvent('changedPerPage.pragma.table', null, false, true)
    )
  }
  
  /*
    * This function is used for handle the condition of row
    * search data based on the filter the searchable
  */
  PragmaDataTable.prototype.tableRowHandler = function(start,end) {
    if (this.searchElement_.value.trim() !=='' || this.searchResults.length > 0){
      this.searchRow(start, end)
    }else{
      this.manageLinks(start, end, this.totalRows)
      this.drawRows(start, end, this.perPageField.value, this.totalRows)
    }
  }
  
  // The component registers itself. It can assume componentHandler is available
  // in the global scape.
  componentHandler.register({
    constructor: PragmaDataTable,
    classAsString: 'PragmaDataTable',
    cssClass: 'pragma-data-table',
    widget: true
  })