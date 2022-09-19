---
layout: default
---

<ul>
  {% for post in site.posts %}
    <li>
      <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
      {{ post.excerpt }}
      <b>By</b> {{ post.author }}   <b style="margin-left:5em;">Tags:</b> {{ post.tags }}
      <br><br>
    </li>
  {% endfor %}
</ul>