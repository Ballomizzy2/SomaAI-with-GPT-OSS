using System;
using UnityEngine;
using TMPro;

public class ClickRaycast : MonoBehaviour
{
    AppContoller appContoller;
    [SerializeField] private TextMeshProUGUI painRegionText;

    private void Start()
    {
        appContoller = FindObjectOfType<AppContoller>();
    }

    void Update()
    {
        if (Input.GetMouseButtonDown(0)) // Left mouse button
        {
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            RaycastHit hit;

            if (Physics.Raycast(ray, out hit))
            {
                // Check if the hit object has a collider
                Collider clickedCollider = hit.collider;
                if (clickedCollider != null)
                {
                    string s = clickedCollider.gameObject.name;
                    Debug.Log("You clicked on: " + s);
                    appContoller.SetPainRegionFromAnatomy(s);
                    painRegionText.text = s;
                }
            }
        }
    }
}
