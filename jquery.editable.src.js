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
                onsubmit    : function(line,cols){return window.confirm("确认删除“"+cols.eq(1).text()+"”吗？");},
                callback    : function(data){return true;}
            },
            save            : {
                bar         : "tr>td:last-child>a.save",
                action      : "",
                method      : "post",
                data        : null,
                dataType    : "json",
                onsubmit    : function(line,cols){return true;},
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

                var line = $(_this).find('tbody>tr:last'),
                    columns = line.find(">td");
                for(var i=0,l=columns.length; i<l; i++){
                    if(settings.columns[i] && settings.columns[i].type=="readonly"){
                        columns.eq(i).html('<div></div>');
                    }
                }

                _this.find("tbody>tr:last").addClass("newer");
                // FIXME: do better.
                _this.find("tbody>tr:last>td:last>a.edit").click();
                _this.find("tbody>tr:last>td>input").val("");
            });
        }
        $(settings.edit.bar, this).live("click", function(){
            var line = $(this).parent().parent(),
                columns = line.find(">td");
            for(var i=0,col,$col,val,type,name,sz,l=columns.length; i<l; i++){
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
                name = settings.columns[i].name;
                columns[i].innerHTML = '<input type="'+type+'" name="'+name+'" style="width:'+($col.innerWidth()-2)+'px;" size="'+sz+'" value="'+val+'" />';
            }
            var p=$(_this), idx=line[0].rowIndex-1;
            $(settings.edit.bar, p).eq(idx).hide();
            $(settings.remove.bar, p).eq(idx).hide();
            $(settings.save.bar, p).eq(idx).show();
            $(settings.cancel.bar, p).eq(idx).show();
        });
        $(settings.remove.bar, this).live("click",function(){
            var __this=this,
                line = $(this).parent().parent(),
                cols = line.find(">td");
            if(settings.remove.onsubmit &&
                settings.remove.onsubmit instanceof Function &&
                !settings.remove.onsubmit.call(this,line,cols)){
                    return;
            }
            var d=settings.remove.data instanceof Function?settings.remove.data.call(this,line,cols):(settings.remove.data||"");
            $.ajax({
                data : d,
                type: settings.remove.method,
                dataType : settings.remove.dataType,
                url : settings.remove.action,
                success : function(data,state){
                    if(data.status=="ok"){
                        if(settings.remove.callback.call(__this, data)){
                            $(__this).parent().parent().remove();
                        }
                    }else{
                        alert(data.msg)
                    }
                }
            });
        });
        $(settings.save.bar, this).live("click",function(){
            var __this=this, dt=[],
                line = $(this).parent().parent();
                columns = line.find(">td");
            if(settings.save.data instanceof Function){
                dt[0] = settings.save.data.call(this,line,columns);
            }else if(settings.save.data){
                dt[0] = settings.save.data;
            }
            if(settings.save.onsubmit &&
                settings.save.onsubmit instanceof Function &&
                !settings.save.onsubmit.call(this,line,columns)){
                    return;
            }
            for(var i=0,col,$col,ipt,name,val,l=columns.length; i<l; i++){
                if(!settings.columns[i] || !settings.columns[i].type){continue;}
                col=columns[i], $col=$(col);
                ipt = $col.find("input");
                val = ipt.val();
                name = ipt.attr("name");
                var min=settings.columns[i].min,
                    max=settings.columns[i].max;
                switch(settings.columns[i].type){
                case "readonly":
                    continue;
                case "number":
                case "int":
                    if(!validate(val,"int",min,max)){
                        ipt.focus();
                        ipt.css('border-color','#f00');
                        return;
                    }else{
                        ipt.css('border-color','');
                    }
                    dt[dt.length] = name+"="+encodeURIComponent(val);
                    break;
                case "float":
                    if(!validate(val,"float",min,max)){
                        ipt.focus();
                        ipt.css('border-color','#f00');
                        return;
                    }else{
                        ipt.css('border-color','');
                    }
                    dt[dt.length] = name+"="+encodeURIComponent(val);
                    break;
                case "text":
                    if(!validate(val,"text",min,max)){
                        ipt.focus();
                        ipt.css('border-color','#f00');
                        return;
                    }else{
                        ipt.css('border-color','');
                    }
                    dt[dt.length] = name+"="+encodeURIComponent(val);
                    break;
                default:
                    continue;
                }
            }
            if(line.hasClass("newer")){
                dt[dt.length] = "isadd=1";
            }
            $.ajax({
                data : dt.join("&"),
                type: settings.save.method,
                dataType : settings.save.dataType,
                url : settings.save.action,
                success : function(data,state){
                    if(data.status!="ok"){
                        alert(data.msg);
                        return;
                    }
                    //var line = $(__this).parent().parent();
                        //columns = line.find(">td");
                    if(settings.save.callback.call(__this, data)){
                        for(var i=0,col,$col,val,l=columns.length; i<l; i++){
                            if(!settings.columns[i] || !settings.columns[i].type){continue;}
                            col=columns[i], $col=$(col);
                            val = $col.find("input").val();
                            switch(settings.columns[i].type){
                            case "readonly":
                                if(line.hasClass("newer")){
                                    val = data.msg;
                                    break;
                                }
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
                    if(line.hasClass("newer")){
                        line.removeClass("newer");
                    }
                }
            });
        });
        $(settings.cancel.bar, this).live("click", function(){
            var line = $(this).parent().parent();
                columns = line.find(">td");
            if(line.hasClass("newer")){
                line.remove();
                return;
            }
            for(var i=0,col,$col,ipt,val,l=columns.length; i<l; i++){
                if(!settings.columns[i] || !settings.columns[i].type){continue;}
                col=columns[i], $col=$(col);
                ipt=$col.find("input");
                switch(settings.columns[i].type){
                case "readonly":
                    continue;
                case "number":
                case "int":
                    val = parseInt(ipt[0].defaultValue);
                    break;
                case "float":
                    val = parseFloat(ipt[0].defaultValue);
                    break;
                case "text":
                    val = ipt[0].defaultValue;
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
        function validate(val,type,min,max){
            switch(type){
            case 'int':
            case 'number':
                if(!/^[0-9]+$/.test(val) || val==Number.NaN || val<min || val>max){
                    alert("请输入["+min+","+max+"]之间的整数。");
                    return false;
                }
                return true;
            case 'float':
                if(!/^[0-9]+(?:\.[0-9]+)?$/.test(val) || val==Number.NaN || val<min || val>max){
                    alert("请输入["+min+","+max+"]之间的数值。");
                    return false;
                }
                return true;
            case 'text':
                var len=String(val).length;
                if(len<min || len>max){
                    alert("请输入长度在["+min+","+max+"]之间的字符串。");
                    return false;
                }
                return true;
            default:
                return false;
            }
        }
    };
})(jQuery);
