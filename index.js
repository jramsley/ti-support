'use strict';

const bent = require('bent');

const learnerID = ''; //add learn ID here
const apiToken = ''; //add token here
const endpoint = ''; //add baseurl here
const headers = {
  'Authorization': `Bearer ${apiToken}`
};

async function getUser (userId) {
  const path = `/incoming/v2/users/${userId}`;
  return bent(endpoint, 'json', 'GET', headers)(path);
}

async function getAllCourses () {
  const path = '/incoming/v2/content';
  let courses = [];

  async function* getCoursePage() {
    let page;
    while(true) {
      const response = await bent(endpoint, 'json', 'GET', headers)(`${path}?cursor=${page}`);
      if(!response.pageInfo.hasMore) {
        return;
      }

      yield response.contentItems;

      page = response.pageInfo.cursor;
    }
  }

  for await (let coursePage of getCoursePage()) {
    courses = courses.concat(coursePage);
  }

  return courses;
}

async function updateUser (user, slugs) {
  const path = `/incoming/v2/users/${learnerID}`;
  const putBody = {
    upsert: true,
    email: user.email,
    replaceCourseAccess: true,
    courseSlugs: slugs
  };

  return bent(endpoint, 'PUT', headers)(path, putBody);
}

async function removeCourse () {
  const userDetails = await getUser(learnerID);
  const purchasedCourses = userDetails.purchasedCourses;
  const allCourses = await getAllCourses();

  const slugs = purchasedCourses.map(course => {
    return allCourses.find(d => d.id === course.courseId).slug;
  });

  // remove one
  slugs.pop();

  return (await updateUser(userDetails, slugs)).text();
}

removeCourse().then(console.log).catch(console.log);
