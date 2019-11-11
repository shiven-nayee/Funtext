import os
import re
import praw
import datetime
import requests
from dotenv import load_dotenv
from bs4 import BeautifulSoup
load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
USER_AGENT = os.getenv("USER_AGENT")

reddit = praw.Reddit(client_id = CLIENT_ID, client_secret = CLIENT_SECRET, user_agent = USER_AGENT)

subreddit = reddit.subreddit("animecalendar")

def downloadImage(imageUrl, fileName, month, day):
    # Makes request to url
    response = requests.get(imageUrl)

    # Checks it is a valid url and valid directory
    if response.status_code == 200:
      directory = f'images/{month}/{day}/'
      if not os.path.exists(directory):
        os.makedirs(directory)
      finalDirectory = f'images/{month}/{day}/{fileName}'
      print('Downloading %s...' % (fileName))
      # Download and saves file to directory
      with open(finalDirectory, 'wb') as fo:
        for chunk in response.iter_content(4096):
          fo.write(chunk)


for submission in subreddit.hot(limit = 1000):
  time = submission.created
  month = datetime.datetime.fromtimestamp(time).month
  day = datetime.datetime.fromtimestamp(time).day
  url = submission.url
  pattern = re.compile(r'(https://i.imgur.com/(.*))(\?.*)?')
  # print(pattern)

  match = re.search(pattern, url)

  if match:
    imageFile = url[url.rfind('/') + 1:]
    downloadImage(url, imageFile, month, day)

  # if 'https://i.imgur.com/' in submission.url:
  #   print(url)