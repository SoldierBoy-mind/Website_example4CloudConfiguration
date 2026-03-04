"use strict";



function Film(id, title, isfavourite = false, watchdate, rate ) {
    this.id = id;
    this.title = title;
    this.isfavourite = isfavourite;
    this.watchdate = watchdate;
    this.rate = rate;

}