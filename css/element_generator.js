;
function _getCounter(countStep, startValue) {
    var counter = 0;
    if (startValue != undefined) {
        counter = startValue;
    }
    var step = typeof(countStep) != "number" ? 1 : countStep;
    return function() {
        counter += step;
        return counter;
    }
}

function _createElement(type, params, text) {
    var elem = document.createElement(type);
    if (params != undefined && Object.keys(params).length > 0) {
        for (var i in params) {
            elem.setAttribute(i, params[i]);
        }
    }
    if (text != undefined) {
        elem.textContent = text;
    }
    return elem;
}

function _getDiv(params, text) {
    return _createElement("div", params, text);
}

function _getSpan(params, text) {
    return _createElement('span', params, text);
}

function _getTextInput(params) {
    var inp = _createElement("input", params);
    inp.type = "text";
    return inp;
}

function _getHidden(params) {
    return _getHiddenInput(params);
}

function _getHiddenInput(params) {
    var inp = _createElement("input", params);
    inp.type = "hidden";
    return inp;
}

function _getRadio(params) {
    var inp = _createElement("input", params);
    inp.type = 'radio';
    return inp;
}

function _getCheckBox(params) {
    var inp = _createElement("input", params);
    inp.type = 'checkbox';
    return inp;
}

function _getSelect(params) {
    return _createElement("select", params);
}

function _getOption(params, text) {
    return _createElement("option", params, text);
}

function _getLabel(params, text) {
    return _createElement('label', params, text);
}

function _getHr(params) {
    return _createElement('hr', params);
}

function _getA(params, text) {
    return _createElement("a", params, text);
}

function _getI(params, text) {
    return _createElement("i", params, text);
}

function _getText(text) {
    return document.createTextNode(text);
}

function _getButton(params, text) {
    return _createElement("button", params, text);
}

function _getH4(params, text) {
    return _createElement("h4", params, text);
}

function _getCanvas(params) {
    return _createElement('canvas', params);
}

function _getImage(params) {
    return _createElement('img', params);
}