/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
;
(function(){
    
    var counter = _getCounter();
    
    function calculator(selector) {
        var wrappers = document.querySelectorAll(selector);
        return {
            /**
             * [
             *  {
             *      spriteSrc: 'url',   - спрайт линейки
             *      wrapper: Node,      - блок, в который нужно вставить виджет (результат функции document.getElement* или document.createElement)
             *      id: id,             - идентификатор виджета, будет использован в элементах внутри wrapper
             *      summands : [
             *          {
             *              'minValue',     - цифры, или выражения типа: result.minValue + result.value - summands.<index>.value * 10. 
         *                                      При этом математические знаки ДОЛЖНЫ быть отделены пробелами, даже если они просто стоят,
         *                                      чтобы показать отрицательность выражения (если числовое значение, а не выражение, 
         *                                      то пробелы перед знаокм минус не нужны)
             *              'maxValue',
             *              'value',
             *              'class',
             *              'id'
             *          },
             *      ],
             *      result : {
             *          'minValue',
             *          'maxValue',
             *          'class',
             *          'id'
             *      }
             *  },
             * ]
             * 
             * @param Array|Object params
             * @returns function
             */
            init : function(params){
                
                var calculators = [];
                for (var i = 0; i < wrappers.length; i++) {
                    if (params[i] != undefined) {
                        var param = Object.assign(
                            {
                                wrapper : wrappers[i],
                                id : 'c' + counter()
                            }, 
                            params[i]
                        );
                        calculators.push(new Calculator(param));
                    }
                    else {
                        var param = Object.assign(
                            {
                                wrapper : wrappers[i],
                                id : 'c' + counter()
                            }, 
                            params
                        );
                        calculators.push(new Calculator(param));
                    }
                }
            }
        };
        
    }
    
    window.calculator = calculator;
    
    
    /**************************************************************************/
    
    
    /**
    * {
            spriteSrc: 'url',   - спрайт линейки
            wrapper: Node,      - блок, в который нужно вставить виджет (результат функции document.getElement* или document.createElement)
            id: id,             - идентификатор виджета, будет использован в элементах внутри wrapper
            summands : [
                {
                    'minValue',
                    'maxValue',
                    'value',
                    'class',
                    'id'
                },
            ],
            result : {
                'minValue',
                'maxValue',
                'class',
                'id'
            }
        }
     * @param Object params
     * @returns Calculator
     */
    function Calculator(params) {
        this.id;
        this.wrapper;
        this.expression;
        this.line;
        
        this.init(params);
    }
    
    Calculator.prototype.init = function(params) {
        this.wrapper = params['wrapper'];
        this.id = params['id'];
        this.expression = new Expression(this, {
            summands : ArrayHelper.getValue(params, 'summands', []),
            result : ArrayHelper.getValue(params, 'result', {})
        });
        this.line = new Line(this, {
            line : params['line'],
            summands : ArrayHelper.getValue(params, 'summands', []),
            result : ArrayHelper.getValue(params, 'result', {})
        });
        
        if (ArrayHelper.count(this.line.summands) > 0) {
            for (var i in this.line.summands) {
                this.line.summands[i].addRelation(this.expression.summands[i]);
                this.line.summands[i].setDepend(this.expression.summands[i]);
            }
        }
        this.line.result = this.expression.result;
        this.line.start();
    }
    
    /**
     * 
     * @param Calculator parent
     * {
     *  summands : {},
     *  result : {}
     * }
     * @param Object params
     * @returns {calculator_L7.SummandContainer}
     */
    function SummandContainer(parent, params) {
        /**
         * @var Calculator
         */
        this.parent = parent;
        this.id;
        this.wrapper;
        this.summands = {};
        this.result;
        
        this.init(params);
    }
    
    SummandContainer.prototype.init = function(params) {
        this.createWrapper(params);
        var summands = ArrayHelper.getValue(params, 'summands', []);
        if (Object.keys(summands).length > 0) {
            var result = ArrayHelper.getValue(params, 'result', {});
            result = Object.assign({}, result, {parent : this, id : this.id + '_result'});
            this.result = this.createResultObject(result);
            for (var i in summands) {
                var summand = Object.assign({}, summands[i]);
                summand['parent'] = this;
                summand = this.correctMinMaxParams(summand, 'minValue');
                summand = this.correctMinMaxParams(summand, 'maxValue');
                ArrayHelper.setIfNotExists(summand, 'id', this.id + '_summand_' + i);
                this.summands[i] = this.createSummandObject(summand);
            }
        }
        this.parent.wrapper.appendChild(this.wrapper);
    }
    
    SummandContainer.prototype.correctMinMaxParams = function(summandParams, attr) {
        var signs = ['-', '+', '*', '/'];
        var enabledFirstSigns = ['-'];
        
        var paramVal = ArrayHelper.getValue(summandParams, attr, undefined);
        if (paramVal != undefined && paramVal * 1 != paramVal) {
            var minExpression = paramVal.split(' ');
            paramVal = [];
            if (minExpression.length > 0) {
                for (var i = 0; i < minExpression.length; i++) {
                    var el = minExpression[i];
                    if (i == 0) {
                        var isSign = true;
                        if (signs.includes(el)) {
                            isSign = false;
                            if (!enabledFirstSigns.includes(el)) {
                                throw new Error('Недопустимый знак "' + el + '" в начале выражения!');
                            }
                        }
                    }
                    if (!isSign && !signs.includes(el) || isSign && signs.includes(el)) {
                        throw new Error('Недопустимая последовательность выражений!');
                    }
                    
                    isSign = !isSign;
                    if (!isSign) {
                        if (el * 1 != el) {
                            el = el.split('.');
                            el = (function(obj, attrs){
                                var obj = obj;
                                var attrs = attrs;
                                return function() {
                                    var res = undefined;
                                    if (attrs.length > 0) {
                                        res = obj;
                                        for (var i in attrs) {
                                            res = ArrayHelper.getValue(res, attrs[i]);
                                        }
                                    }
                                    return res;
                                }
                            })(this, el);
                        }
                    }
                    paramVal.push(el);
                }
            }
            if (paramVal.length > 0) {
                paramVal = (function(expression){
                    var expression = expression;
                    return function() {
                        var func = 'return ';
                        for (var i in expression) {
                            var expr = expression[i];
                            if (typeof expr == 'function') {
                                func += expr();
                                continue;
                            }
                            func += expr;
                        }
                        return (new Function('', func))();
                    };
                })(paramVal);
            }
            else {
                paramVal = undefined;
            }
        }
        summandParams[attr] = paramVal;
        return summandParams;
    }
    
    function Expression(parent, params) {
        this.class = 'expression';
        
        this.plusSign = _getSpan({class : 'sign plus'}, ' + ');
        this.equalsSign = _getSpan({class : 'sign equals'}, ' = ');
        
        SummandContainer.call(this, parent, params);
    }
    
    Expression.prototype = Object.create(SummandContainer.prototype);
    Expression.prototype.constructor = Expression;
    
    Expression.prototype.init = function(params) {
        SummandContainer.prototype.init.call(this, params);
        var count = 0;
        for (var i in this.summands) {
            if (count > 0 && this.summands[i].value >= 0) {
                this.wrapper.appendChild(this.plusSign.cloneNode(true));
            }
            this.summands[i].show();
            count++;
        }
        this.wrapper.appendChild(this.equalsSign.cloneNode(true));
        this.result.show();
    }
    
    Expression.prototype.createResultObject = function(params) {
        return new ResultDecorator(new SpanSummand(params));
    }
    
    Expression.prototype.createSummandObject = function(params) {
        return new SpanSummand(params);
    }
    
    Expression.prototype.createWrapper = function(params) {
        this.id = this.parent.id + '_e';
        this.wrapper = _getDiv({id : this.id, class : this.class});
    }
    
    
    /****************************** Summand ***********************************/
    
    /**
     * {
     *  parent : parent,    - Expression
     *  id : id,            - id элемента слогаемого
     *  class : class       - имена классов элемента, по умолчанию summand
     *  value : val         - значение слогаемого, по умолчанию случайно сгенерированное число
     *  minValue : val      - минимальное допустимое число
     *  maxValue : val      - максимальное допустимое число
     * }
     * @param Object params
     * @returns Summand
     */
    function Summand(params) {
        this.parent;
        this.value;
        this._minValue;
        this._maxValue;
        this.wrapper;
        this.class;
        this.relations = [];
        this.dependent;
        this.scale = 7.5;
        this.minSize = 15;
        
        this.init(params);
    }
    
    Summand.prototype.init = function(params) {
        Object.defineProperty(this, 'minValue', {
            get : function() {
                var result = this._minValue;
                if (typeof this._minValue == 'function') {
                    result = this._minValue();
                }
                return result;
            },
            set : function(val) {
                this._minValue = val;
            },
            enumerable : true
        });
        Object.defineProperty(this, 'maxValue', {
            get : function() {
                var result = this._maxValue;
                if (typeof this._maxValue == 'function') {
                    result = this._maxValue();
                }
                return result;
            },
            set : function(val) {
                this._maxValue = val;
            },
            enumerable : true
        });

        //проверить на существование элементы массива
        this.parent = params['parent'];
        this.id = params['id'];
        this.class = ArrayHelper.getValue(params, 'class', this.getDefaultClass());
        this.wrapper = this.createWrapper({id : this.id, class : this.class});
        this.minValue = ArrayHelper.getValue(params, 'minValue', undefined);
        this.maxValue = ArrayHelper.getValue(params, 'maxValue', undefined);
        var defaultVal = MathHelper.rand(this.minValue, this.maxValue);
        this.value = ArrayHelper.getValue(params, 'value', defaultVal);
    }
    
    Summand.prototype.show = function() {
        this.changeValue(this.value);
        this.parent.wrapper.appendChild(this.wrapper);
    }
    
    Summand.prototype.setDepend = function(summand) {
        this.dependent = summand;
    }
    
    Summand.prototype.createWrapper = function(params) {
        return _getDiv(params);
    }
    
    Summand.prototype.changeValue = function(value) {
        this.value = value;
        this.changeWrapperValue(this.value);
        this.checkRange();
        var scale = this.scale * value.length;
        this.wrapper.style.width = (scale > this.minSize ? scale : this.minSize) + 'px';
    }
    
    Summand.prototype.setError = function() {
        this.wrapper.classList.add('error');
        if (this.relations.length > 0) {
            for (var i in this.relations) {
                if (!this.relations[i].wrapper.classList.contains('error')) {
                    this.relations[i].setError();
                }
            }
        }
    }
    
    Summand.prototype.removeError = function() {
        this.wrapper.classList.remove('error');
        if (this.relations.length > 0) {
            for (var i in this.relations) {
                if (this.relations[i].wrapper.classList.contains('error')) {
                    this.relations[i].removeError();
                }
            }
        }
    }
    
    Summand.prototype.changeWrapperValue = function(value) {
        this.wrapper.innerHTML = value;
    }
    
    Summand.prototype.checkRange = function() {
        if (this.isInRange()) {
            this.removeError();
            return;
        }
        this.setError();
    }
    
    Summand.prototype.isInRange = function() {
        if (this.value == '') {
            return false;
        }
        var lessThanMax = true;
        var moreThanMin = true;
        
        var max = this.maxValue;
        var min = this.minValue;
        
        if (this.dependent != undefined) {
            max = this.dependent.value;
        }
        if (this.dependent != undefined) {
            min = this.dependent.value;
        }
        
        if (max !== undefined) {
            lessThanMax = this.value <= max;
        }
        if (min !== undefined) {
            moreThanMin = this.value >= min;
        }
        return lessThanMax && moreThanMin;
    }
    
    Summand.prototype.getDefaultClass = function() {
        return 'summand';
    }
    
    Summand.prototype.addRelation = function(relatedSummand) {
        if (ArrayHelper.valueExists(this.relations, relatedSummand)) {
            return;
        }
        //relatedSummand.changeValue(this.value);
        this.relations.push(relatedSummand);
    }
    
    Summand.prototype.removeRelation = function(relatedSummand) {
        ArrayHelper.remove(this.relations, relatedSummand);
    }
    
    Summand.prototype.changeWrapperToInput = function() {
        var params = ArrayHelper.getAttributes(this.wrapper);
        params['class'] = InputSummand.defaultClass;
        
        this.replaceWrapperTo(_getTextInput(params));
        this.changeWrapperValue = InputSummand.prototype.changeWrapperValue;
        this.changeValue(this.value);
        InputSummand.prototype.setOnkeyup.call(this);
    }
    
    Summand.prototype.changeWrapperToSpan = function() {
        var params = ArrayHelper.getAttributes(this.wrapper);
        params['class'] = SpanSummand.defaultClass;
        
        this.replaceWrapperTo(_getSpan(params));
        this.changeWrapperValue = SpanSummand.prototype.changeWrapperValue;
        this.changeValue(this.value);
    }
    
    Summand.prototype.replaceWrapperTo = function(node) {
        var oldWrapper = this.wrapper;
        this.wrapper = node;
        this.parent.wrapper.replaceChild(this.wrapper, oldWrapper);
    }
    
    /**************************** InputSummand ***************************************/
    
    function InputSummand(params) {
        Summand.call(this, params);
    }
    InputSummand.defaultClass = 'summand input';
    
    InputSummand.prototype = Object.create(Summand.prototype);
    InputSummand.prototype.constructor = InputSummand;
    
    InputSummand.prototype.init = function(params) {
        Summand.prototype.init.call(this, params);
        this.setOnkeyup();
    }
    
    InputSummand.prototype.setOnkeyup = function() {
        var that = this;
        this.wrapper.onkeyup = function() {
            var val = correctValue(this.value).trim();
            that.changeValue(val);
            
            function correctValue(val) {
                if (val * 1 == val) {
                    return val;
                }
                val = val.substr(0, val.length - 1);
                return correctValue(val);
            }
            
        }
    }
    
    InputSummand.prototype.createWrapper = function(params) {
        return _getTextInput(params);
    }
    
    InputSummand.prototype.changeWrapperValue = function(value) {
        this.wrapper.value = value;
    }
    
    InputSummand.prototype.getDefaultClass = function() {
        return InputSummand.defaultClass;
    }
    
    /*************************** SpanSummand **********************************/
    
    function SpanSummand(params) {
        Summand.call(this, params);
    }
    SpanSummand.defaultClass = 'summand span';
    
    SpanSummand.prototype = Object.create(Summand.prototype);
    SpanSummand.prototype.constructor = SpanSummand;
    
    SpanSummand.prototype.createWrapper = function(params) {
        return _getSpan(params);
    }
    
    SpanSummand.prototype.getDefaultClass = function() {
        return SpanSummand.defaultClass;
    }
    
    /************************** Result ****************************************/
    
    function ResultDecorator(summand) {
        var summand = summand;
        this.getSummand = function() {
            return summand;
        }
        
        this.result;
        
        this.init();
    }
    
    ResultDecorator.defaultClass = 'summand result';
    
    ResultDecorator.prototype.init = function() {
        Object.defineProperties(this, {
            summand : {
                get : function () {
                    return this.getSummand();
                }
            },
            value : {
                get : function() {
                    return this.summand.value;
                },
                set : function(val) {
                    this.summand.value = val;
                }
            },
            minValue : {
                get : function() {
                    return this.summand.minValue;
                },
                set : function(val) {
                    this.summand.minValue = val;
                }
            },
            maxValue : {
                get : function() {
                    return this.summand.maxValue;
                },
                set : function(val) {
                    this.summand.maxValue = val;
                }
            },
            parent : {
                get : function() {
                    return this.summand.parent;
                }
            },
            wrapper : {
                get : function() {
                    return this.summand.wrapper;
                },
            },
            relations : {
                get : function() {
                    return this.summand.relations;
                }
            },
        });
        this.changeValue('?');
    }
    
    ResultDecorator.prototype.show = function() {
        this.changeValue(this.value);
        this.parent.wrapper.appendChild(this.wrapper);
    }
    
    ResultDecorator.prototype.getDefaultClass = function() {
        return ResultDecorator.defaultClass;
    }
    
    ResultDecorator.prototype.changeValue = function(value) {
        this.value = value;
        this.summand.changeWrapperValue(this.value);
        this.checkRange();
    }
    
    ResultDecorator.prototype.checkRange = function() {
        if (this.isInRange()) {
            this.wrapper.classList.remove('error');
            return;
        }
        this.wrapper.classList.add('error');
    }
    
    ResultDecorator.prototype.isInRange = function() {
        if (this.result != undefined) {
            return this.checkResult();
        }
        if (this.value.trim() == '?') {
            return true;
        }
        return this.summand.isInRange();
    }
    
    ResultDecorator.prototype.createWrapper = function(params) {
        return this.summand.createWrapper(params);
    }
    
    ResultDecorator.prototype.checkResult = function() {
        return this.value == this.result;
    }
    
    ResultDecorator.prototype.setResult = function(result) {
        this.result = result;
    }
    
    ResultDecorator.prototype.changeWrapperToInput = function() {
        this.summand.value = '';
        this.summand.changeWrapperValue = '';
        this.summand.changeWrapperToInput();
        var listener = this.summand.wrapper.onkeyup;
        (function(listener, summand){
            summand.wrapper.onkeyup = function() {
                listener.call(this);
                summand.changeValue(summand.value);
                if (summand.checkResult()) {
                    summand.changeWrapperToSpan();
                }
            }
        })(listener, this);
        
    }
    
    ResultDecorator.prototype.changeWrapperToSpan = function() {
        this.summand.changeWrapperToSpan();
    }
    
    /********************************** Line **********************************/
    
    /**
     * 
     * @param Calculator parent
     * {
     *  summands : {},
     *  result : {},
     *  line : {
     *      sprite : 'src',
     *      offset : {
     *          x : 5,
     *          y : 5
     *      },         -   отступ от левого края спрайта до начального деления шкалы
     *      interval : '10'       -   расстояние между делениями
     *      beginValue : 0,         -   значение начального деления, по умолчанию 0
     *      id : 'id',              -   идентификатор блока со спрайтом
     *  }
     * }
     * @param Object params
     * @returns {calculator_L7.Line}
     */
    function Line(parent, params) {
        this.sprite;
        this.offset;
        this.topOffset = 100;
        this.interval;
        this.beginValue;
        this.class = 'line-container';
        this.canvas;
        this.context;
        this.currentSummand;
        this.arrows = [];
    
        SummandContainer.call(this, parent, params);
    }
    
    Line.prototype = Object.create(SummandContainer.prototype);
    Line.prototype.constructor = Line;
    
    Line.prototype.init = function(params) {
        SummandContainer.prototype.init.call(this, params);
        
        this.sprite = ArrayHelper.getRequiredValue(ArrayHelper.getRequiredValue(params, 'line'), 'spriteSrc');
        this.offset = ArrayHelper.getRequiredValue(ArrayHelper.getRequiredValue(params, 'line'), 'offset');
        this.interval = ArrayHelper.getRequiredValue(ArrayHelper.getRequiredValue(params, 'line'), 'interval');
        this.beginValue = ArrayHelper.getValue(ArrayHelper.getRequiredValue(params, 'line'), 'beginValue', 0);
        
        var keys = Object.keys(this.summands);
        if (keys.length > 0) {
            this.showSummand(this.summands[keys[0]]);
            
            for (var i in this.summands) {
                var listener = this.summands[i].wrapper.onkeyup;
                (function(listener, summand, line) {
                    summand.wrapper.onkeyup = function() {
                        listener.call(this);
                        if (summand.isInRange()) {
                            if (line.showNextSummand(summand)) {
                                line.createArrow(summand.value);
                            }
                            else {
                                line.result.changeWrapperToInput();
                                line.result.setResult(line.getSumm());
                            }
                        }
                    }
                })(listener, this.summands[i], this);
            }
        }
    }
    
    Line.prototype.start = function() {
        this.createCanvas();
    }
    
    Line.prototype.getSumm = function() {
        var res = 0;
        for (var i in this.summands) {
            res += 1 * this.summands[i].value;
        }
        return res;
    }
    
    Line.prototype.showSummand = function(summand) {
        summand.value = '';
        summand.changeWrapperValue('');
        summand.show();
        this.currentSummand = summand
    }
    
    Line.prototype.showNextSummand = function(summand) {
        summand.changeWrapperToSpan();
        var next = false;
        for (var i in this.summands) {
            if (next) {
                this.showSummand(this.summands[i]);
                return true;
            }
            if (this.summands[i] === summand) {
                next = true;
            }
        }
        return false;
    }
    
    Line.prototype.createResultObject = function(params) {
        return new ResultDecorator(new SpanSummand(params));
    }
    
    Line.prototype.createSummandObject = function(params) {
        return new InputSummand(params);
    }
    
    Line.prototype.createWrapper = function(params) {
        this.id = ArrayHelper.getValue(params, 'id', this.parent.id + '_l');
        this.wrapper = _getDiv({id : this.id, class : this.class});
    }
    
    Line.prototype.createCanvas = function() {
        this.canvas = _getCanvas();
        this.wrapper.appendChild(this.canvas);
        this.context = this.canvas.getContext('2d');
        var sprite = new Image();
        sprite.src = this.sprite;
        var context = this.context;
        var canvas = this.canvas;
        var topOffset = this.topOffset;
        var that = this;
        sprite.onload = function() {
            canvas.width = sprite.width;
            canvas.height = sprite.height + topOffset;
            context.beginPath();
            context.drawImage(sprite, 0, topOffset);
            that.createArrow();
        }
    }
    
    Line.prototype.createArrow = function(value) {
        if (value == undefined) {
            value = this.beginValue;
        }
        this.addArrow(new Arrow(value, this.currentSummand.dependent.value));
        this.drawCurrentArrow();
        this.correctSummandPosition();
    }
    
    Line.prototype.addArrow = function(arrow) {
        if (!ArrayHelper.valueExists(this.arrows, arrow)) {
            this.arrows.push(arrow);
        }
    }
    
    Line.prototype.drawCurrentArrow = function() {
        if (ArrayHelper.count(this.arrows) > 0) {
            var keys = Object.keys(this.arrows);
            this.drawArrow(this.arrows[keys[keys.length - 1]]);
        }
    }
    
    Line.prototype.drawArrow = function(arrow) {
        var context = this.context;
        var rate = this.topOffset / this.canvas.width;
        
        var x0 = this.interval * arrow.begin + 1 * this.offset.x;
        var y0 = this.topOffset + this.offset.y;
        var x1 = x0 + arrow.value * this.interval / 2;
        var y1 =  - rate * arrow.value * this.interval;
        var x2 = arrow.value * this.interval + x0;
        var y2 = this.topOffset + this.offset.y;
        
        arrow.topPosition = y1;
        arrow.middlePosition = x1;
        
        var ang = this.getAngle(arrow.value * this.interval / 2, this.topOffset + Math.abs(y1));
        var ang1 = ((90 - ang) / 2) > 25 ? ((90 - ang) / 2) : (90 - ang);
        var ang2 = ang / 2 > 25 ? ang / 2 : ang;
        ang1 = ang1 > ang2 ? ang2 : ang1;
        ang2 = ang - ang1;
        ang1 = ang + ang1;
        ang1 = Math.PI * ang1 / 180;
        ang2 = Math.PI * ang2 / 180;
        
        var y3 = 10 * Math.sin(ang1);
        var x3 = y3 / Math.tan(ang1);
        var x4 = 10 * Math.cos(ang2);
        var y4 = x4 * Math.tan(ang2);
        
        context.strokeStyle = 'red';
        context.beginPath();
        context.moveTo(x0, y0);
        context.bezierCurveTo(x0,y0, x1,y1, x2,y2);
        context.moveTo(x2, y2);
        context.lineTo(x2 - x3, y2 - y3);
        context.moveTo(x2, y2);
        context.lineTo(x2 - x4, y2 - y4);
        context.stroke();
    }
    
    Line.prototype.getAngle = function(a, h) {
        var c = Math.sqrt(a*a + h*h);
        var cos = a / c;
        var ang = Math.acos(cos) * 180 / Math.PI;
        return ang;
    }
    
    Line.prototype.correctSummandPosition = function() {
        var arrow = this.arrows[ArrayHelper.count(this.arrows) - 1];
        var leftOffset = this.canvas.offsetLeft;
        var topOffset = this.canvas.offsetTop;
        var left = leftOffset + arrow.middlePosition - 5;
        var top = topOffset + (Math.abs(arrow.topPosition) + this.topOffset) / 2 + arrow.topPosition - 5;
        this.currentSummand.wrapper.style.top = top + 'px';
        this.currentSummand.wrapper.style.left = left + 'px';
    }
    
    function Arrow(startPosition, value) {
        this.begin = startPosition;
        this.value = value;
        this.topPosition;
        this.middlePosition;
    }
    
})();

function ArrayHelper() {};
ArrayHelper.getValue = function(array, attr, def) {
    if (array[attr] == undefined) {
        return def;
    }
    return array[attr];
}

ArrayHelper.getRequiredValue = function(array, attr) {
    if (array[attr] == undefined) {
        throw new Error('Отсутствует обязательный параметр "' + attr + '"!');
    }
    return array[attr];
}

ArrayHelper.setIfNotExists = function(array, attr, value) {
    if (array[attr] == undefined) {
        array[attr] = value;
    }
}

ArrayHelper.valueExists = function(array, value) {
    if (array.length > 0) {
        for (var i in array) {
            if (array[i] === value) {
                return true;
            }
        }
    }
    return false;
}

ArrayHelper.remove = function(array, value) {
    var res = [];
    if (typeof array == 'object') {
        var res = {};
    }
    if (array.length > 0) {
        for (var i in array) {
            if (array[i] != value) {
                res[i] = value;
            }
        }
    }
    return res;
}

ArrayHelper.getAttributes = function(node) {
    var attributes = node.attributes;
    var params = {};
    for (var i = 0; i < attributes.length; i++) {
        params[attributes[i].name] = attributes[i].value;
    }
    return params;
}

ArrayHelper.merge = function(object1, object2) {
    var result = {};
    Object.assign(result, object1, object2);
    return result;
}

ArrayHelper.count = function(array) {
    return Object.keys(array).length;
}

function MathHelper() {};
MathHelper.rand = function(min, max) {
    var defMax = Math.floor(Math.random() * 1000000);
    var sign = Math.random() > 0.5 ? 1 : -1;
    var defMin = sign * Math.floor(Math.random() * 1000000);
    if (max == undefined && min == undefined) {
        max = defMax > defMin ? defMax : defMin;
        min = defMax > defMin ? defMin : defMax;
    }
    if (min != undefined && max == undefined) {
        max = min + defMax;
    }
    if (max != undefined && min == undefined) {
        min = defMin - max;
    }
    return Math.floor(Math.random() * (max - min + 1) + min);
}