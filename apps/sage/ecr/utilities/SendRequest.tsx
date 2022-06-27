import React, { useEffect, useState } from 'react'
import * as BK from '../../../../components/apis/beekeeper'

useEffect(() => {
    // POST request using fetch inside useEffect React hook
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'React Hooks POST Request Example' })
    };
    fetch('https://reqres.in/api/posts', requestOptions)
        .then(response => response.json())
        .then(data => console.log(data));

// empty dependency array means this effect will only run once (like componentDidMount in classes)
}, []);