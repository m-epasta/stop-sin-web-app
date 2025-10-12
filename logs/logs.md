## LOG sytem

[stop-sin-web-app/simple-debug.log](simple-debug.log): retrieves you to logs file (useless).

[stop-sin-web-app/logs](logs): logs file.There's all the console status who's written in [stop-sin-web-app/app/lib/logger.ts](app/lib/logger.ts).

to avoid making you read code from deepseek, i will do something by myself once.

 ### structure of logs:
(Example of a log)
``` typescript
{"level":"info","message":"[3/3] retrieved: All API keys loaded successfully","timestamp":"2025-10-10 16:22:44"}
```

# structure

It's a json file (like a hashmap) so every data is passed like:
``` JSON
{ <- curly braces that open a dictionnary/hashmap or just a JSON data container 
    key: value,
}```

 - the key is the given name of the value so it can be like

``` JSON
{
    country: france
}
```

# level

 - tell the level of the message.In this app it can be info, warn, error, debug.
In this example it's ```JSON {"level":"info",}``` info: key=level  value=info

# message

message sent by the API: pasted into logs 

(example with code snppet):
``` typescript
      logger.error('Missing authorization header');
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 } 
      )
```
 - here we can see that the console status: (logger.error with error as the level) indicates the error that the API sent in response to the request
the difference is that the response is given to the guy who sent the request so here, the user
but the log is directly sent in a file that i will commit every day to have a green dot))).
its mainly used to debug and/or to see what and where the error is or the exception that happened(warn).

# timestamp

As i evaluate you not being that stupid i guess that by reading the value and the name of timestamp,
i shouldn't explain what does it do.

# important

i putted(is it english?) a rate limit.I DO NOT put my database code in the repo because i estimate that regardless of the data that will be sent there,
it would be a bad idea because it could helps bad people to somehow know from who this data came.Even though i didnt written the' database and the mobile app yet, im not gonna risk by marking the database.I will explain my database structure later in this file.

So, request does not update database because i didnt find a way to prevent from limiting correctly API' usage.
Im now using a way that use the browser signature to prevent refreshing page but i think that its easy to come through.

As i said, my dayabase is not created yet so by onw i will say there that the refresh will be every 6 hours, 1 day or every hour depending on the new data and the users using my app and so the database.



