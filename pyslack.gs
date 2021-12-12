function doPost(e){

  const VERIFICATION_TOKEN = {slack_verification_token};
  const SLACK_WEBHOOK = {slack_webhook_url};
  const BOT_USER = {bot_user_name};

  // Google Cloud Function Endpoint
  const GCF_ENDPOINT = {gcf_endpoint_url};
  const MAX_NUM_OUTPUT_LINE = 40;  // GCFからのレスポンスの最大表示行数
  
  // Events APIからのPOSTを取得
  // 参考→https://api.slack.com/events-api
  const json = JSON.parse(e.postData.getDataAsString());
  
  // Events APIからのPOSTであることを確認
  if (VERIFICATION_TOKEN != json.token) {
    throw new Error("invalid token.");
  }
  
  // Events APIを使用する初回、URL Verificationのための記述
  if (json.type == "url_verification") {
    return ContentService.createTextOutput(json.challenge);
  }

  // Botの投稿の場合、無視
  if('subtype' in json.event) {
    return
  }
  // テキストが含まれない場合、無視
  if(!('text' in json.event)) {
    return
  }
  
  // リクエスト内容を整形
  req_text = json.event.text.split(BOT_USER)[1].trim();

  // リクエスト内容に"@pyslack"が含まれる場合、エラーを返す
  // リクエスト内容整形時に"@pyslack"はすべて消える気がするので要修正
  if('@pyslack' in req_text) {
    req_text = "Mentions to the bot is not allowed to be included in the input."
  }

  // POSTデータを作成
  var post_data =
  {
    "method" : "post",
    "contentType" : "application/json",
    "payload" : JSON.stringify(
      {
        "message" : req_text
      }
    )
  };
  // Google Cloud FunctionsにPOST
  console.log("POST Google Cloud Functions");
  console.log(req_text);
  var res_gcf = UrlFetchApp.fetch(GCF_ENDPOINT, post_data);

  // レスポンス内容に"@pyslack"が含まれる場合、エラーを返す
  if('@pyslack' in res_gcf) {
    res_gcf = "Mentions to the bot is not allowed to be included in the output."
  }
  // レスポンス内容が指定された行よりも多い場合、エラーを返す
  // TODO: 指定された行までは表示するように改良する
  var len_gcf_res_line = res_gcf.split('\n').length
  if(len_gcf_res_line > MAX_NUM_OUTPUT_LINE) {
    res_gcf = "The available maximum number of output lines is 40, but the output has ${len_gcf_res_line} lines."
  }

  // slackに投稿
  userName = json.event.user;
  if('text' in json.event) {
  // 実際に表示されるメッセージ内容
    var contents = `<@${userName}>\n${res_gcf}`
  }
  // リクエスト内容を整形
  var options =
  {
    "method" : "post",
    "contentType" : "application/json",
    "payload" : JSON.stringify(
      {
        "text" : contents,
        link_names: 1
      }
    )
  };
  // slackにPOST
  console.log("POST Slack");
  console.log(contents)
  UrlFetchApp.fetch(SLACK_WEBHOOK, options);
}
