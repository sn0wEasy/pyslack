class Qprint():
    def __init__(self):
        self.res_string = ''

    def qprint(self, *objects):
        res = ''
        for obj in objects:
            res += str(obj) + ' '
        res = str(res.strip()) + '\n'
        self.res_string += res
        return res
    
    def res(self):
        return self.res_string


def pyslack(request):
    """Responds to any HTTP request.
    Args:
        request (flask.Request): HTTP request object.
    Returns:
        The response text or any set of values that can be turned into a
        Response object using
        `make_response <http://flask.pocoo.org/docs/1.0/api/#flask.Flask.make_response>`.
    """
    request_json = request.get_json()
    if request.args and 'message' in request.args:
        # return request.args.get('message')
        return "Error: bad request."
    elif request_json and 'message' in request_json:
        try:
            raw_obj = request_json['message']
            input_obj = '\n'.join(['    ' + e for e in raw_obj.split('\n')])
            exec_obj = """
def func():
    inst = Qprint()
    qprint = inst.qprint
{}
    return inst.res()
            """.format(input_obj)
            exec(exec_obj)
            ret = eval("func()")
            return f"{ret}"
        except Exception as e:
            return "Error:\n{}".format(e)
    else:
        return "Error: bad request."
