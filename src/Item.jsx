import $ from "jquery";
import anime from "animejs";

var timeOut;

class Item {
    constructor(icon, fw, backgroundColor, message) {
        if(icon==="list"){
            this.$element = $(document.createElement("div"));
        }
        else{
            this.$element = $(document.createElement("button"));
        }
        this.icon = icon;
        this.fw = fw;
        this.$element.addClass("item");
        this.$element.attr("id",icon);
        this.$element.css("background-color", backgroundColor);
        var i = document.createElement("i");
        if(icon!=="list"){
            var span = document.createElement("span");
            span.innerHTML=message;
            span.style.backgroundColor=backgroundColor;
        }
        $(i).addClass(fw + " fa-lg");
        this.$element.append(i);
        this.$element.append(span);
        this.prev = null;
        this.next = null;
        this.isMoving = false;
        var element = this;
        this.$element.on("mousemove", function() {
            clearTimeout(timeOut);
            timeOut = setTimeout(function() {
                if (element.next && element.isMoving) {
                    element.next.moveTo(element);
                } 
            }, 10);
        });
    }
    
    moveTo(item) {
        anime({
            targets: this.$element[0],
            left: item.$element.css("left"),
            top: item.$element.css("top"),
            duration: 700,
            elasticity: 500
        });
        if (this.next) {
            this.next.moveTo(item);
        }
    }

    updatePosition() {    
        anime({
            targets: this.$element[0],
            left: this.prev.$element.css("left"),
            top: this.prev.$element.css("top"),
            duration: 80
        });
        
        if (this.next) {
            this.next.updatePosition();
        }
    }
}

export default Item;