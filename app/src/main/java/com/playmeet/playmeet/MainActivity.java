package com.playmeet.playmeet;

import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.Toast;


//fcm
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.apache.http.protocol.HTTP;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.FormBody;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;


public class MainActivity extends AppCompatActivity {
    WebView mWebView;
    String mToken;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mWebView = (WebView)findViewById(R.id.webView);

        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setDefaultZoom(WebSettings.ZoomDensity.FAR);

        FirebaseInstanceId.getInstance().getInstanceId().addOnSuccessListener( MainActivity.this,  new OnSuccessListener<InstanceIdResult>() {
            @Override
            public void onSuccess(InstanceIdResult instanceIdResult) {
                mToken = instanceIdResult.getToken();
                Log.d("Token-------------",mToken);
                updateUserInfo();
//                new JSONTask().execute("http://172.30.1.36:3000/token");
//                sendHttpWithMsg("http://172.30.1.36:3000/token");
            }
        });

        //alert 대응
        mWebView.setWebChromeClient(new WebChromeClient(){
            @Override
            public boolean onJsAlert(WebView view, String url, String message, JsResult result)
            {
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                result.confirm();
                return true;
            }
        });

        mWebView.setWebViewClient(new WebViewClient() {

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        mWebView.loadUrl("http://172.30.1.36:3000/login");
    }


    public void updateUserInfo(){
        OkHttpClient client = new OkHttpClient();

        RequestBody formBody = new FormBody.Builder()
                .add("token", mToken)
                .build();

        Request request = new Request.Builder()
                .url("http://172.30.1.36:3000/token")
                .post(formBody)
                .build();

        client.newCall(request).enqueue(updateUserInfoCallback);
    }

    private Callback updateUserInfoCallback = new Callback() {
        @Override
        public void onFailure(Call call, IOException e) {
            Log.d("TEST", "ERROR Message : " + e.getMessage());
        }

        @Override
        public void onResponse(Call call, Response response) throws IOException {
            final String responseData = response.body().string();
            Log.d("TEST", "responseData : " + responseData);
        }
    };


    public String sendHttpWithMsg(String url){

//기본적인 설정
        DefaultHttpClient client = new DefaultHttpClient();
        HttpPost post = new HttpPost(url);
        HttpParams params = client.getParams();
        HttpConnectionParams.setConnectionTimeout(params, 3000);
        HttpConnectionParams.setSoTimeout(params, 3000);
        post.setHeader("Content-type", "application/json; charset=utf-8");

// JSON OBject를 생성하고 데이터를 입력합니다.
//여기서 처음에 봤던 데이터가 만들어집니다.

        JSONObject jObj = new JSONObject();

        try {
            jObj.put("name", "hong");
            jObj.put("phone", "000-0000");

        } catch (JSONException e1) {
            e1.printStackTrace();
        }

        try {

// JSON을 String 형변환하여 httpEntity에 넣어줍니다.

            StringEntity se;
            se = new StringEntity(jObj.toString());
            HttpEntity he=se;
            post.setEntity(he);

        } catch (UnsupportedEncodingException e1) {
            e1.printStackTrace();	}

        try {

//httpPost 를 서버로 보내고 응답을 받습니다.

            HttpResponse response = client.execute(post);

// 받아온 응답으로부터 내용을 받아옵니다.

// 단순한 string으로 읽어와 그내용을 리턴해줍니다.

            BufferedReader bufReader =
                    new BufferedReader(new InputStreamReader(
                            response.getEntity().getContent(),
                            "utf-8"
                    )
                    );

            String line = null;
            String result = "";

            while ((line = bufReader.readLine())!=null){
                result +=line;
            }

            return result;


        } catch (ClientProtocolException e) {
            e.printStackTrace();
            return "Error"+e.toString();
        } catch (IOException e) {
            e.printStackTrace();
            return "Error"+e.toString();
        }
    }


     //post
    public class JSONTask extends AsyncTask<String, String, String> {
        @Override
        protected String doInBackground(String... urls) {
            try {
                //JSONObject를 만들고 key value 형식으로 값을 저장해준다.
                JSONObject jsonObject = new JSONObject();
                jsonObject.accumulate("token", mToken);
                jsonObject.accumulate("user_id", "androidTest");

                Log.d("jsonObject--------- : ", jsonObject.toString());

                HttpURLConnection con = null;
                BufferedReader reader = null;

                try{
                    URL url = new URL(urls[0]);
                    //연결을 함
                    /*con = (HttpURLConnection) url.openConnection();

                    con.setRequestMethod("POST");//POST방식으로 보냄
                    con.setRequestProperty("Cache-Control", "no-cache");//캐시 설정
                    con.setRequestProperty("Content-Type", "application/json");//application JSON 형식으로 전송
                    con.setRequestProperty("Accept", "text/html");//서버에 response 데이터를 html로 받음
                    con.setDoOutput(true);//Outstream으로 post 데이터를 넘겨주겠다는 의미
                    con.setDoInput(true);//Inputstream으로 서버로부터 응답을 받겠다는 의미
                    con.connect();

                    //서버로 보내기위해서 스트림 만듬
                    OutputStream outStream = con.getOutputStream();
                    //버퍼를 생성하고 넣음
                    BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outStream));
                    writer.write(jsonObject.toString());
                    writer.flush();
                    writer.close();//버퍼를 받아줌*/

                    DefaultHttpClient client = new DefaultHttpClient();
                    HttpPost post = new HttpPost("http://172.30.1.36:3000/token");

                    StringEntity entity = new StringEntity(jsonObject.toString(), HTTP.UTF_8);
                    post.setEntity(entity);
                    post.setHeader("Accept", "application/json");
                    post.setHeader("content-type", "application/json");

                    HttpResponse response = (HttpResponse)client.execute(post);



                    /*//서버로 부터 데이터를 받음
                    InputStream stream = con.getInputStream();

                    reader = new BufferedReader(new InputStreamReader(stream));

                    StringBuffer buffer = new StringBuffer();

                    String line = "";
                    while((line = reader.readLine()) != null){
                        buffer.append(line);
                    }

                    return buffer.toString();//서버로 부터 받은 값을 리턴해줌 아마 OK!!가 들어올것임*/

                } catch (MalformedURLException e){
                    Log.e("MalformedURLException--", "here");
                    e.printStackTrace();
                } catch (IOException e) {
                    Log.e("IOException---", "here");
                    e.printStackTrace();
                } finally {
                    if(con != null){
                        con.disconnect();
                    }
                    try {
                        if(reader != null){
                            reader.close();//버퍼를 닫아줌
                        }
                    } catch (IOException e) {
                        Log.e("IOException---", "herehere");
                        e.printStackTrace();
                    }
                }
            } catch (Exception e) {
                Log.e("Exception--", "here");
                e.printStackTrace();
            }

            return null;
        }
       /* @Override
        protected void onPostExecute(String result) {
            super.onPostExecute(result);
        }*/
    }


}
