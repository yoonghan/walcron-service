const root = {
  preflight: function(req, res){
    res.end();
  },
  monitor: async function(req, res) {
    res.json({'status': 'initiated reader'});
  }
};

export default root;
