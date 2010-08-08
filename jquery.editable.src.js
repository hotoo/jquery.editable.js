/**
 * @author 闲耘™ (hotoo.cn[AT]gmail.com)
 * @version 1.0, 2010/08/03
 */
(function($){
    $.fn.editable = function(options){
        var defaults = {
            operateColumn   : "tr>td:last-child",
            columns         : [],
            create          : {
                bar         : null,
                callback    : function(){}
            },
            edit            : {
                bar         : "tr>td:last-child>a.edit",
                callback    : function(){}
            },
            "remove"        : {
                bar         : "tr>td:last-child>a.remove",
                action      : "",
                method      : "post",
                data        : null,
                dataType    : "json",
                callback    : function(data){return true;}
            },
            save            : {
                bar         : "tr>td:last-child>a.save",
                action      : "",
                method      : "post",
                data        : null,
                dataType    : "json",
                callback    : function(data){return true;}
            },
            cancel          : {
                bar         : "tr>td:last-child>a.cancel",
                callback    : function(){}
            }
        };
        var settings = $.extend(settings, defaults, options);
        var _this = this;
        if(settings.create.bar){
            $(settings.create.bar).click(function(){
                _this.find("tbody").append(
                    _this.find("tbody>tr:eq(0)").clone()
                );
                // FIXME: do better.
                _this.find("tbody>tr:last>td:last>a.edit").click();
                _this.find("tbody>tr:last>td>input").val("");
            });
        }
        $(settings.edit.bar, this).live("click", function(){
            var line = $(this).parent().parent(),
                columns = line.find(">td");
            for(var i=0,col,$col,val,type,sz,l=columns.length; i<l; i++){
                if(!settings.columns[i] || !settings.columns[i].type){continue;}
                col=columns[i], $col=$(col);
                val = $col.text();
                switch(settings.columns[i].type){
                case "readonly":
                    continue;
                case "number":
                case "int":
                    val = parseInt(val);
                    type = "number";
                    sz = size(settings.columns[i].max);
                    break;
                case "float":
                    val = parseFloat(val);
                    type = "number";
                    sz = size(settings.columns[i].max);
                    break;
                case "text":
                    val = val;
                    type = "text";
                    sz = settings.columns[i].max;
                    break;
                default:
                    continue;
                }
                columns[i].innerHTML = '<input type="'+type+'" style="width:'+($col.innerWidth()-5)+'px;" size="'+sz+'" value="'+val+'" />';
            }
            var p=$(_this), idx=line[0].rowIndex-1;
            $(settings.edit.bar, p).eq(idx).hide();
            $(settings.remove.bar, p).eq(idx).hide();
            $(settings.save.bar, p).eq(idx).show();
            $(settings.cancel.bar, p).eq(idx).show();
        });
        $(settings.remove.bar, this).live("click",function(){
            var __this=this;
            $.ajax({
                data : settings.remove.data instanceof Function?settings.remove.data.call(this):settings.remove.data,
                type: settings.remove.method,
                dataType : settings.remove.dataType,
                url : settings.remove.action,
                success : function(data,state){
                    if(settings.remove.callback.call(__this, data)){
                        $(__this).parent().parent().remove();
                    }
                }
            });
        });
        $(settings.save.bar, this).live("click",function(){
            var __this=this;
            $.ajax({
                data : settings.save.data instanceof Function?settings.save.data.call(this):settings.save.data,
                type: settings.save.method,
                dataType : settings.save.dataType,
                url : settings.save.action,
                success : function(data,state){
                    if(settings.save.callback.call(__this, data)){
                        var line = $(__this).parent().parent();
                            columns = line.find(">td");
                        for(var i=0,col,$col,val,l=columns.length; i<l; i++){
                            if(!settings.columns[i] || !settings.columns[i].type){continue;}
                            col=columns[i], $col=$(col);
                            val = $col.find("input").val();
                            switch(settings.columns[i].type){
                            case "readonly":
                                continue;
                            case "number":
                            case "int":
                                val = parseInt(val);
                                break;
                            case "float":
                                val = parseFloat(val);
                                break;
                            case "text":
                                val = val;
                                break;
                            default:
                                continue;
                            }
                            columns[i].innerHTML = '<div>'+val+'</div>';
                        }
                        var p=$(_this), idx=line[0].rowIndex-1;
                        $(settings.save.bar, p).eq(idx).hide();
                        $(settings.cancel.bar, p).eq(idx).hide();
                        $(settings.edit.bar, p).eq(idx).show();
                        $(settings.remove.bar, p).eq(idx).show();
                    }
                }
            });
        });
        $(settings.cancel.bar, this).live("click", function(){
            var line = $(this).parent().parent();
                columns = line.find(">td");
            for(var i=0,col,$col,val,l=columns.length; i<l; i++){
                if(!settings.columns[i] || !settings.columns[i].type){continue;}
                col=columns[i], $col=$(col);
                val = $col.find("input").val();
                switch(settings.columns[i].type){
                case "readonly":
                    continue;
                case "number":
                case "int":
                    val = parseInt(val);
                    break;
                case "float":
                    val = parseFloat(val);
                    break;
                case "text":
                    val = val;
                    break;
                default:
                    continue;
                }
                columns[i].innerHTML = '<div>'+val+'</div>';
            }
            var p=$(_this), idx=line[0].rowIndex-1;
            $(settings.save.bar, p).eq(idx).hide();
            $(settings.cancel.bar, p).eq(idx).hide();
            $(settings.edit.bar, p).eq(idx).show();
            $(settings.remove.bar, p).eq(idx).show();
        });

        function size(val){
            return String(val).length;

            if(typeof val =="string" || val instanceof String){
                return val.length;
            }else if(typeof(val)=="number" || val instanceof Number){
                return String(val).length;
            }
        }
    };
})(jQuery);
