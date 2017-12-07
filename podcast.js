jQuery(document).ready(function(){
    
    if( jQuery("#podplayer").length > 0 ){
        var audio = jQuery("#podplayer audio").get(0);
        
        if( !(audio.canPlayType && audio.canPlayType('audio/mpeg;') )){
            jQuery("#podplayer").remove();
            return;
        }
    
        var playing = false;
        var storeBlocked = false;
        var blockTimer = 0;
        var timer = 0;

        var supportsLocalStorage = function(){
            var mod = 'modernizr';
            try {
                localStorage.setItem(mod, mod);
                localStorage.removeItem(mod);
                return true;
            } catch (e) {
                return false;
            }
        }();

        function blockStoreFor10Secs(){
            storeBlocked = true;
            clearTimeout(blockTimer);
            blockTimer = setTimeout(function(){
                storeBlocked = false;
            }, 10 * 1000);
            
            if(supportsLocalStorage){
                localStorage.removeItem("podcast");
            }
        }

        function storePlayback(){
            if(!storeBlocked && supportsLocalStorage){
                if(playing){
                    localStorage.setItem("podcast", audio.currentTime);
                }
                else{
                    localStorage.removeItem("podcast");
                }
            }
        }

        function loadPlayback(){
            if(supportsLocalStorage && localStorage.getItem("podcast") !== null){
                audio.currentTime = localStorage.getItem("podcast");
                play();
            }
        }

        function updateCallback(){
            var ratio = audio.currentTime / audio.duration;
            jQuery("#podplayer .slider div").css("width", (ratio*100) + "%");

            if(ratio >= 1 || audio.paused){
                pause();
            }
            else{
                storePlayback();
            }
        }

        function play(){
            playing = true;
            jQuery("#podplayer .pname").css("display", "none");
            jQuery("#podplayer .slider").css("display", "block");
            jQuery("#podplayer button").addClass("pause").removeClass("play");
            audio.play();
            clearInterval(timer);
            timer = setInterval(updateCallback, 1000);
            storePlayback();
            ping("play");
        }

        function pause(){
            playing = false;
            jQuery("#podplayer .pname").css("display", "block");
            jQuery("#podplayer .slider").css("display", "none");
            jQuery("#podplayer button").addClass("play").removeClass("pause");
            audio.pause();
            clearInterval(timer);
            storePlayback();
            ping("pause");
        }
        
        function ping(action){
            jQuery.ajax({
                url: "/shipping/delivery/playback", 
                data: {p: action, t: audio.currentTime},
                type: "post"
            });
        }

        function playPause(){
            if(playing){
                pause();
            }
            else{
                play();
            }
        }

        jQuery("#podplayer .pname, #podplayer button")
                .click(playPause);

        jQuery("#podplayer .slider").click(function(e){
            var $this = jQuery("#podplayer .slider");
            var x = Math.max(e.pageX - $this.offset().left, 0);
            audio.currentTime = (x / $this.width()) * audio.duration;
            updateCallback();
        });

        //If opening a new tab, need to erase playback state while new window loads
        //to avoid double playing
        jQuery("a[target='_blank']").click(function(){
            blockStoreFor10Secs();
        });

        loadPlayback();
    }
});