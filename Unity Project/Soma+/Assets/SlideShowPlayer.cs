using UnityEngine;
using System.Collections.Generic;
using System.Collections;
public class SlideShowPlayer : MonoBehaviour
{
    [SerializeField]
    List<GameObject> slides;
    int currentSlide = 0;
    
    [SerializeField]
    GameObject back, forward;
    
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void MoveSlideShow(int forwardOrBackward)
    {
        back.SetActive(true);
        forward.SetActive(true);
        
        int predictFuture = currentSlide + forwardOrBackward;
        if (predictFuture < 0)
        {
            back.SetActive(false);
            return;
        }

        if (predictFuture >= slides.Count-1)
        {
            forward.SetActive(false);
            //return;
        }
        
        slides[currentSlide].SetActive(false);
        currentSlide = predictFuture;
        slides[currentSlide].SetActive(true);

    }

    public void FinishSlideShow()
    {
        this.gameObject.SetActive(false);
    }
}
