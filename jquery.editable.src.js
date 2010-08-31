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
                oncreate    : function(cols){
                    cols.filter(':last').append(
                        '<a href="javascript:void(0);" class="edit">编辑</a>'+
                        '<a href="javascript:void(0);" class="remove">删除</a>'+
                        '<a href="javascript:void(0);" class="save">保存</a>'+
                        '<a href="javascript:void(0);" class="cancel">取消</a>'
                    );
                },
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
        function mkInput(val,context,opt){
            switch(opt.type){
            case "readonly":
                if(opt.creatable){
                    type="text";
                    sz = opt.maxlen;
                    break;
                }else{
                    return "";
                }
            case "number":
            case "int":
                //val = parseInt(val);
                type = "number";
                sz = opt.maxlen;
                break;
            case "float":
                //val = parseFloat(val);
                type = "number";
                sz = opt.maxlen;
                break;
            case "text":
                //val = val;
                type = "text";
                sz = opt.maxlen;
                break;
            default:
                return "";
            }
            return '<input type="'+type+'" name="'+opt.name+'" style="width:'+
                (context.innerWidth()-2)+'px;"'+
                (sz?' maxlength="'+sz+'"':'')+' value="'+val+'" />';
        }
        if(settings.create.bar){
            $(settings.create.bar).click(function(){
                var cs = _this.find('thead>tr>th'),s='<tr class="newer">';
                for(var i=0,t,l=cs.length; i<l; i++){
                    if(settings.columns[i]){
                        if(settings.columns[i].type=="readonly" && !settings.columns[i].creatable){
                            s+='<td><div></div></td>';
                        }else{
                            s+='<td>'+mkInput("",$(cs[i]),settings.columns[i])+'</td>'
                        }
                    }else{
                        s+='<td></td>';
                    }
                }

                _this.find("tbody").append(s+'</tr>');
                if(settings.create.oncreate instanceof Function){
                    settings.create.oncreate.call(this, _this.find('tbody>tr:last>td'));
                }
            });
        }
        $(settings.edit.bar, this).live("click", function(){
            var line = $(this).parent().parent(),
                columns = line.find(">td");
            for(var i=0,$col,l=columns.length; i<l; i++){
                if(!settings.columns[i] || !settings.columns[i].type){continue;}
                switch(settings.columns[i].type){
                case "readonly":
                    continue;
                case "number":
                case "int":
                case "float":
                case "text":
                    $col=$(columns[i]);
                    //$(mkInput($col.text(),settings.columns[i])).css({"width":$col.innerWidth()-2}).appendTo($col);
                    //$(mkInput($col.text(),settings.columns[i])).css({"width":$col.innerWidth()-2}).appendTo($col);
                    $col.html(mkInput($col.text(),$col,settings.columns[i]));
                    break;
                default:
                    continue;
                }
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
        // SAVE.
        $(settings.save.bar, this).live("click",function(){
            var line = $(this).parent().parent();
            if(line.hasClass("newer")){
                create.call(this,line);
            }else{
                update.call(this,line);
            }
        });
        function update(line){
            if($(this).data("running")){return;}
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
                    dt[dt.length] = settings.columns[i].name+"="+encodeURIComponent(encodeURIComponent($col.text()));
                    break;
                case "number":
                case "int":
                    if(!validate(ipt,settings.columns[i])){return;}
                    dt[dt.length] = name+"="+encodeURIComponent(encodeURIComponent(val));
                    break;
                case "float":
                    if(!validate(ipt,settings.columns[i])){return;}
                    dt[dt.length] = name+"="+encodeURIComponent(encodeURIComponent(val));
                    break;
                case "text":
                    if(!validate(ipt,settings.columns[i])){return;}
                    dt[dt.length] = name+"="+encodeURIComponent(encodeURIComponent(val));
                    break;
                default:
                    continue;
                }
            }
            $(this).data("running", true).css({"color":"#ccc","cursor":"default"});
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
                    if(settings.save.callback.call(__this, data)){
                        for(var i=0,col,$col,val,l=columns.length; i<l; i++){
                            if(!settings.columns[i] || !settings.columns[i].type){continue;}
                            col=columns[i], $col=$(col);
                            val = $col.find("input").val();
                            switch(settings.columns[i].type){
                            case "readonly":
                                continue;
                            case "pkey":
                                break;
                            case "number":
                            case "int":
                                //val = parseInt(val);
                                break;
                            case "float":
                                //val = parseFloat(val);
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

                    $(__this).data("running", false).css({"color":"","cursor":""});
                }
            });
        }
        function create(){
            if($(this).data("running")){return;}
            var __this=this, dt=[],
                line = $(this).parent().parent();
                columns = line.find(">td");
            if(settings.create.data instanceof Function){
                dt[0] = settings.create.data.call(this,line,columns);
            }else if(settings.create.data){
                dt[0] = settings.create.data;
            }
            if(settings.create.onsubmit &&
                settings.create.onsubmit instanceof Function &&
                !settings.create.onsubmit.call(this,line,columns)){
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
                    if(settings.columns[i].creatable){
                        if(!new RegExp(settings.columns[i].pattern).test(val)){
                            ipt.focus();
                            ipt.css('border-color','#f00');
                            alert(settings.columns[i].msg)
                            return;
                        }else{
                            ipt.css('border-color','');
                        }
                        dt[dt.length] = name+"="+encodeURIComponent(encodeURIComponent(val));
                    }else{
                        dt[dt.length] = settings.columns[i].name+"="+encodeURIComponent(encodeURIComponent($col.text()));
                    }
                    break;
                case "number":
                case "int":
                    if(!validate(ipt,settings.columns[i])){return;}
                    dt[dt.length] = name+"="+encodeURIComponent(encodeURIComponent(val));
                    break;
                case "float":
                    if(!validate(ipt,settings.columns[i])){return;}
                    dt[dt.length] = name+"="+encodeURIComponent(encodeURIComponent(val));
                    break;
                case "text":
                    if(!validate(ipt,settings.columns[i])){return;}
                    dt[dt.length] = name+"="+encodeURIComponent(encodeURIComponent(val));
                    break;
                default:
                    continue;
                }
            }
            dt[dt.length] = "isadd=1";
            $(this).data("running", true).css({"color":"#ccc","cursor":"default"});
            $.ajax({
                data : dt.join("&"),
                type: settings.create.method,
                dataType : settings.create.dataType,
                url : settings.create.action,
                success : function(data,state){
                    if(data.status!="ok"){
                        alert(data.msg);
                        return;
                    }
                    //var line = $(__this).parent().parent();
                        //columns = line.find(">td");
                    if(settings.create.callback.call(__this, data)){
                        for(var i=0,col,$col,val,l=columns.length; i<l; i++){
                            if(!settings.columns[i] || !settings.columns[i].type){continue;}
                            col=columns[i], $col=$(col);
                            val = $col.find("input").val();
                            switch(settings.columns[i].type){
                            case "readonly":
                                if(settings.columns[i].creatable){
                                    break;
                                }else{
                                    //val = data.msg;
                                    continue;
                                }
                            case "pkey":
                                break;
                            case "number":
                            case "int":
                                //val = parseInt(val);
                                break;
                            case "float":
                                //val = parseFloat(val);
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
                    line.removeClass("newer");

                    $(__this).data("running", false).css({"color":"","cursor":""});
                }
            });
        }
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
                    //val = parseInt(ipt[0].defaultValue);
                    val = ipt[0].defaultValue;
                    break;
                case "float":
                    //val = parseFloat(ipt[0].defaultValue);
                    val = ipt[0].defaultValue;
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

        function validate(elem,opt){
            var val=elem.val(), len=String(val).length, rt=true, msg=[];
            if(len==0 && opt.empty){return true;}

            switch(opt.type){
            case 'int':
            case 'number':
                if(!/^[0-9]*$/.test(val)){
                    msg[msg.length] = "整数";
                    rt = false;
                }
                if(opt.min && opt.min>val){
                    msg[msg.length] = "值大于或等于 "+opt.min;
                    rt = false;
                }
                if(opt.max && opt.max<val){
                    msg[msg.length] = "值小于或等于 "+opt.max;
                    rt = false;
                }
                if(opt.minlen && opt.minlen>len){
                    msg[msg.length] = "长度大于或等于 "+opt.minlen+" 位";
                    rt = false;
                }
                if(opt.maxlen && opt.maxlen<len){
                    msg[msg.length] = "长度小于或等于 "+opt.maxlen+" 位";
                    rt = false;
                }
                if(opt.pattern && !new RegExp(opt.pattern).test(val)){
                    msg[msg.length] = opt.msg||"符合特定规则/"+opt.pattern+"/";
                    rt = false;
                }
                msg = "请输入："+msg.join("，");
                break;
            case 'float':
                if(!/^[0-9]*(?:\.[0-9]+)?$/.test(val)){
                    msg[msg.length] = "浮点数";
                    rt =  false;
                }
                if(opt.min && opt.min>val){
                    msg[msg.length] = "值大于或等于 "+opt.min;
                    rt = false;
                }
                if(opt.max && opt.max<val){
                    msg[msg.length] = "值小于或等于 "+opt.max;
                    rt = false;
                }
                if(opt.minlen && opt.minlen>len){
                    msg[msg.length] = "长度大于或等于 "+opt.minlen+" 位";
                    rt = false;
                }
                if(opt.maxlen && opt.maxlen<len){
                    msg[msg.length] = "长度小于或等于 "+opt.maxlen+" 位";
                    rt = false;
                }
                if(opt.pattern && !new RegExp(opt.pattern).test(val)){
                    msg[msg.length] = opt.msg||"符合特定规则/"+opt.pattern+"/";
                    rt = false;
                }
                msg = "请输入："+msg.join("，");
                break;
            case 'text':
                msg[msg.length] = "字符串";
                if(opt.minlen && opt.minlen>len){
                    msg[msg.length] = "长度大于或等于 "+opt.minlen+" 位";
                    rt = false;
                }
                if(opt.maxlen && opt.maxlen<len){
                    msg[msg.length] = "长度小于或等于 "+opt.maxlen+" 位";
                    rt = false;
                }
                if(opt.pattern && !new RegExp(opt.pattern).test(val)){
                    msg[msg.length] = opt.msg||"符合特定规则/"+opt.pattern+"/";
                    rt = false;
                }
                msg = "请输入："+msg.join("，");
                break;
            default:
                msg = "【警告】不支持 "+opt.type+" 字段类型。";
                rt = false;
                break;
            }
            if(!rt){
                elem.focus();
                elem.css('border-color','#f00');
                alert(msg);
            }else{
                elem.css('border-color','');
            }
            return rt;
        }
    };
})(jQuery);
