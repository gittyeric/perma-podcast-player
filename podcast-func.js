jQuery(document).ready(function(){
    
    if( jQuery("#podplayer").length > 0 ){
        
        const supportsLocalStorage = function(){
            const mod = 'modernizr';
            try {
                localStorage.setItem(mod, mod);
                localStorage.removeItem(mod);
                return true;
            } catch (e) {
                return false;
            }
        }();
        
        const Clock = function(timerRef){
            
            function stopTick(){
                clearInterval(timerRef);
            }
            
            function startTick(){
                const nextTimerRef = setInterval(function(){
                    //Nasty bailout to mutating global scope! Yuck!
                    nastyGlobalishState = updateCallback(nastyGlobalishState);
                }, 1000);
                return Clock(nextTimerRef);
            }
            
            return {
                startTick : startTick,
                stopTick : stopTick
            };
        };

        function blockStoreFor10Secs(state){
            const now = (new Date()).getTime();
            
            if (supportsLocalStorage) {
                localStorage.removeItem("podcast");
            }
            
            return {
                audio: state.audio,
                clock: state.clock,
                blockUntil: now + 10 * 1000
            };
        }

        function storePlayback(state){
            const now = (new Date()).getTime();
            const canStore = state.blockUntil < now && supportsLocalStorage;
            if(canStore){
                if(!state.paused){
                    localStorage.setItem("podcast", audio.currentTime);
                }
                else{
                    localStorage.removeItem("podcast");
                }
            }
        }

        function loadPlayback(audio){
            const initState = {
                audio: audio,
                clock: Clock(0),
                blockUntil: 0
                
            };
            if(supportsLocalStorage && localStorage.getItem("podcast") !== null){
                audio.currentTime = localStorage.getItem("podcast");
                return play(initState);
            }
            return pause(initState);
        }
        
        function updateCallback(state){
            const audio = state.audio;
            const ratio = audio.currentTime / audio.duration;
            jQuery("#podplayer .slider div").css("width", (ratio*100) + "%");

            if(ratio >= 1 || audio.paused){
                return pause(state);
            }
            else{
                storePlayback();
            }
            
            return state;
        }

        function play(state){
            jQuery("#podplayer .pname").css("display", "none");
            jQuery("#podplayer .slider").css("display", "block");
            jQuery("#podplayer button").addClass("pause").removeClass("play");
            audio.play();
            const newClock = state.clock.start();
            storePlayback(state);
            ping("play", state.audio);
            
            return {
                clock: newClock,
                audio: audio,
                blockUntil: state.blockUntil
            };
        }

        function pause(state){
            jQuery("#podplayer .pname").css("display", "block");
            jQuery("#podplayer .slider").css("display", "none");
            jQuery("#podplayer button").addClass("play").removeClass("pause");
            state.audio.pause();
            const newClock = state.clock.stop();
            storePlayback(state.blockUntil, state.audio);
            ping("pause", audio);
            
            return {
                clock: newClock,
                audio: audio,
                blockUntil: state.blockUntil
            };
        }
        
        function ping(action, audio){
            jQuery.ajax({
                url: "/shipping/delivery/playback", 
                data: {p: action, t: audio.currentTime},
                type: "post"
            });
        }

        function playPause(state){
            if(!state.audio.paused){
                pause();
            }
            else{
                play();
            }
        }
        
        
        
        //--------- Caller Code ----------------
        
        const audio = jQuery("#podplayer audio").get(0);
        var nastyGlobalishState = loadPlayback(audio);

        jQuery("#podplayer .pname, #podplayer button")
                .click(function(){
                    nastyGlobalishState = 
                        playPause(nastyGlobalishState);
                });
        
        if( !(audio.canPlayType && audio.canPlayType('audio/mpeg;') )){
            jQuery("#podplayer").remove();
            return;
        }

        jQuery("#podplayer .slider").click(function(e){
            const $this = jQuery("#podplayer .slider");
            const x = Math.max(e.pageX - $this.offset().left, 0);
            audio.currentTime = (x / $this.width()) * audio.duration;
            nastyGlobalishState = updateCallback();
        });

        //If opening a new tab, need to erase playback state while new window loads
        //to avoid double playing
        jQuery("a[target='_blank']").click(function(){
            nastyGlobalishState = blockStoreFor10Secs();
        });
    };

    
});