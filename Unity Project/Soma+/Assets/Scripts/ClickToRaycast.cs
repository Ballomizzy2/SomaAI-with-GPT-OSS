using UnityEngine;
using TMPro;

public class ClickRaycast : MonoBehaviour
{
    AppContoller appContoller;
    [SerializeField] private TextMeshProUGUI painRegionText;
    [SerializeField] private GameObject P3D_PulseEffect;
    [SerializeField] private MeshCollider anatomyMeshCollider;

    private void Start()
    {
        appContoller = FindObjectOfType<AppContoller>();
    }

    void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            RaycastHit hit, hit1;

            // First raycast: section colliders for region name
            if (Physics.Raycast(ray, out hit))
            {
                Collider clickedCollider = hit.collider;
                if (clickedCollider != null)
                {
                    string s = clickedCollider.gameObject.name;
                    Debug.Log("You clicked on: " + s);
                    appContoller.SetPainRegionFromAnatomy(s);
                    painRegionText.text = s;
                }
            }

            // Second raycast: anatomy mesh layer for exact surface position
            int anatomyMask = 1 << LayerMask.NameToLayer("Anatomy");
            if (Physics.Raycast(ray, out hit1, Mathf.Infinity, anatomyMask))
            {
                P3D_PulseEffect.transform.position = hit1.point - hit1.normal * 0.1f;
                P3D_PulseEffect.transform.rotation = Quaternion.LookRotation(hit1.normal);
                P3D_PulseEffect.SetActive(true);
                Debug.Log("You clicked on the anatomy mesh at: " + hit1.collider.gameObject.name);
            }
        }
    }
}